// ─────────────────────────────────────────────
//  app/apprentice/attendance.tsx
//  Mi Asistencia — Aprendiz
//  RF-6.1, RF-6.2, RF-6.3, RF-7.1, RF-7.3
//
//  ✔ Lista agrupada por mes (acordeón colapsable)
//  ✔ Estadísticas del período seleccionado
//  ✔ Filtros rápidos (Todos / Último mes / Trimestre / Año)
//  ✔ Fila tocable → panel de detalle expandible
//    (fecha, estado, hora entrada/salida, tiempo en clase,
//     horario programado, ambiente, instructor)
//  ✔ Solo muestra datos del aprendiz autenticado
//  ✔ Días futuros excluidos
//  ✔ i18n ES / EN / DE / FR
// ─────────────────────────────────────────────
import {
    ATTENDANCE_EVENTS,
    type AttendanceEvent,
    type AttendanceStatus,
} from '@/features/attendance/types';
import { getSnapshot as getEnvironmentsSnapshot } from '@/features/environments/environmentsStore';
import { getSchedulesSnapshot } from '@/features/schedules/schedulesStore';
import type { Schedule } from '@/features/schedules/types';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ── Tipos internos ─────────────────────────────
type FilterPeriod = 'all' | 'lastMonth' | 'lastQuarter' | 'lastYear';

interface ResolvedEvent extends AttendanceEvent {
  instructorName:  string;
  environmentCode: string;
  scheduleStart:   string;
  scheduleEnd:     string;
  durationMin:     number | null;
}

interface MonthGroup {
  key:    string; // "2026-09"
  label:  string; // "Septiembre 2026"
  events: ResolvedEvent[];
}

// ── Colores y íconos por estado ───────────────
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  punctual:   Colors.success,
  late:       Colors.warning,
  absent:     Colors.error,
  invalidEnv: Colors.accentPurple,
};
const STATUS_ICON: Record<AttendanceStatus, keyof typeof Ionicons.glyphMap> = {
  punctual:   'checkmark-circle',
  late:       'time',
  absent:     'close-circle',
  invalidEnv: 'alert-circle',
};

// ── Helpers ────────────────────────────────────
function formatDateLong(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatDateShort(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function calcDuration(entry: string, exit: string): number | null {
  if (!entry || !exit) return null;
  const [eh, em] = entry.split(':').map(Number);
  const [xh, xm] = exit.split(':').map(Number);
  const diff = (xh! * 60 + xm!) - (eh! * 60 + em!);
  return diff > 0 ? diff : null;
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function filterByPeriod(events: AttendanceEvent[], period: FilterPeriod): AttendanceEvent[] {
  const today = new Date();
  if (period === 'all') return events;
  const cutoff = new Date(today);
  if (period === 'lastMonth')   cutoff.setMonth(today.getMonth() - 1);
  if (period === 'lastQuarter') cutoff.setMonth(today.getMonth() - 3);
  if (period === 'lastYear')    cutoff.setFullYear(today.getFullYear() - 1);
  return events.filter(e => new Date(`${e.date}T12:00:00Z`) >= cutoff);
}

// ─────────────────────────────────────────────
//  COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function ApprenticeAttendanceScreen() {
  const { user }          = useAuth();
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();

  const text    = isDark ? Colors.dark.text       : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'              : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)': 'rgba(101,179,97,0.20)';
  const rowDiv  = isDark ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.05)';
  const bg      = isDark ? Colors.dark.background : Colors.light.background;

  const [period,         setPeriod]         = useState<FilterPeriod>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedRow,    setExpandedRow]    = useState<string | null>(null);

  // ── Stores externos ───────────────────────
  const schedules    = getSchedulesSnapshot();
  const environments = getEnvironmentsSnapshot();

  function resolve(evt: AttendanceEvent): ResolvedEvent {
    const sch: Schedule | undefined = schedules.find(s => s.id === evt.scheduleId);
    const env = sch ? environments.find(e => e.id === sch.environmentId) : undefined;
    return {
      ...evt,
      instructorName:  sch?.instructorName  ?? '—',
      environmentCode: env?.code ?? sch?.environmentName ?? '—',
      scheduleStart:   sch?.startTime ?? '—',
      scheduleEnd:     sch?.endTime   ?? '—',
      durationMin:     calcDuration(evt.entryTime, evt.exitTime),
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  const myEvents: ResolvedEvent[] = useMemo(() => {
    const raw = ATTENDANCE_EVENTS
      .filter(e => e.userId === user?.id && e.date <= today)
      .map(resolve);
    return filterByPeriod(raw, period) as ResolvedEvent[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, period, schedules, environments]);

  const stats = useMemo(() => {
    const total    = myEvents.length;
    const punctual = myEvents.filter(e => e.status === 'punctual').length;
    const late     = myEvents.filter(e => e.status === 'late').length;
    const absent   = myEvents.filter(e => e.status === 'absent').length;
    const pct      = total > 0 ? Math.round(((punctual + late) / total) * 100) : 0;
    const totalDelayMin = myEvents.reduce((s, e) => s + (e.delayMinutes ?? 0), 0);
    return { total, punctual, late, absent, pct, totalDelayMin };
  }, [myEvents]);

  // ── Agrupación por mes ────────────────────
  const monthGroups: MonthGroup[] = useMemo(() => {
    const sorted = [...myEvents].sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, ResolvedEvent[]>();
    sorted.forEach(e => {
      const key = e.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    const currentKey = today.slice(0, 7);
    if (expandedMonths.size === 0 && map.has(currentKey)) {
      setExpandedMonths(new Set([currentKey]));
    }
    return Array.from(map.entries()).map(([key, events]) => ({
      key, label: monthLabel(key), events,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEvents]);

  function toggleMonth(key: string) {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleRow(id: string) {
    setExpandedRow(prev => (prev === id ? null : id));
  }

  function statusLabel(status: AttendanceStatus, delay: number): string {
    if (status === 'late')       return `${t('attendance.statuses.late')} · ${delay} min`;
    if (status === 'absent')     return t('attendance.statuses.absent');
    if (status === 'invalidEnv') return t('attendance.statuses.invalidEnv');
    return t('attendance.statuses.punctual');
  }

  // ─────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────
  return (
    <View style={[s.safe, { backgroundColor: bg }]}>

      {/* Header */}
      <View style={[s.header, { borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: text }]}>
          {t('sidebar.myAttendance')}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Tarjeta estadísticas */}
        <View style={[s.statsCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={s.statsRow}>
            {[
              { icon: 'checkmark-circle', color: Colors.success, value: stats.punctual, label: t('attendance.punctual') },
              { icon: 'time',             color: Colors.warning,  value: stats.late,     label: t('attendance.late')     },
              { icon: 'close-circle',     color: Colors.error,    value: stats.absent,   label: t('attendance.absent')   },
            ].map(item => (
              <View key={item.label} style={s.statItem}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
                <Text style={[s.statValue, { color: text }]}>{item.value}</Text>
                <Text style={[s.statLabel, { color: muted }]}>{item.label}</Text>
              </View>
            ))}
            <View style={[s.statItem, s.statHighlight, { borderColor: theme.primary + '40' }]}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.primary} />
              <Text style={[s.statValue, { color: text }]}>{stats.pct}%</Text>
              <Text style={[s.statLabel, { color: muted }]}>{t('dashboard.attendanceRate')}</Text>
            </View>
          </View>
          {stats.totalDelayMin > 0 && (
            <View style={[s.delayRow, { borderTopColor: rowDiv }]}>
              <Ionicons name="hourglass-outline" size={14} color={Colors.warning} />
              <Text style={[s.delayText, { color: muted }]}>
                {t('attendance.totalDelay')}: {formatDuration(stats.totalDelayMin)}
              </Text>
            </View>
          )}
        </View>

        {/* Filtros rápidos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterScroll}
        >
          {(['all', 'lastMonth', 'lastQuarter', 'lastYear'] as FilterPeriod[]).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={[
                s.filterChip,
                {
                  backgroundColor: period === p ? theme.primary + '20' : 'transparent',
                  borderColor:     period === p ? theme.primary        : border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{
                color:      period === p ? theme.primary : muted,
                fontWeight: '700',
                fontSize:   FontSize.sm,
              }}>
                {p === 'all' ? t('attendance.allPeriods') : t(`attendance.${p}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vacío */}
        {myEvents.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={48} color={muted} />
            <Text style={[s.emptyText, { color: muted }]}>
              {t('attendance.noRecordsPeriod')}
            </Text>
          </View>
        )}

        {/* Grupos por mes (acordeón) */}
        {monthGroups.map(group => {
          const isOpen    = expandedMonths.has(group.key);
          const gPunctual = group.events.filter(e => e.status === 'punctual').length;
          const gLate     = group.events.filter(e => e.status === 'late').length;
          const gAbsent   = group.events.filter(e => e.status === 'absent').length;

          return (
            <View
              key={group.key}
              style={[s.monthBlock, { backgroundColor: cardBg, borderColor: border }]}
            >
              {/* Cabecera del mes */}
              <TouchableOpacity
                onPress={() => toggleMonth(group.key)}
                style={s.monthHeader}
                activeOpacity={0.7}
              >
                <View style={s.monthHeaderLeft}>
                  <Ionicons
                    name={isOpen ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={[s.monthTitle, { color: text }]}>{group.label}</Text>
                  <Text style={[s.monthCount, { color: muted }]}>
                    {group.events.length} {t('attendance.classes')}
                  </Text>
                </View>
                <View style={s.monthBadges}>
                  {gPunctual > 0 && (
                    <View style={[s.miniBadge, { backgroundColor: Colors.success + '20' }]}>
                      <Text style={[s.miniBadgeText, { color: Colors.success }]}>{gPunctual}✓</Text>
                    </View>
                  )}
                  {gLate > 0 && (
                    <View style={[s.miniBadge, { backgroundColor: Colors.warning + '20' }]}>
                      <Text style={[s.miniBadgeText, { color: Colors.warning }]}>{gLate}⏱</Text>
                    </View>
                  )}
                  {gAbsent > 0 && (
                    <View style={[s.miniBadge, { backgroundColor: Colors.error + '20' }]}>
                      <Text style={[s.miniBadgeText, { color: Colors.error }]}>{gAbsent}✗</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* Filas del mes */}
              {isOpen && group.events.map((evt, idx) => {
                const color      = STATUS_COLOR[evt.status];
                const icon       = STATUS_ICON[evt.status];
                const isExpanded = expandedRow === evt.id;

                return (
                  <View key={evt.id}>
                    {idx > 0 && (
                      <View style={[s.divider, { backgroundColor: rowDiv }]} />
                    )}

                    {/* Fila principal */}
                    <TouchableOpacity
                      onPress={() => toggleRow(evt.id)}
                      activeOpacity={0.75}
                      style={s.row}
                    >
                      <View style={[s.rowBar, { backgroundColor: color }]} />
                      <View style={[s.rowIcon, { backgroundColor: color + '18' }]}>
                        <Ionicons name={icon} size={18} color={color} />
                      </View>
                      <View style={s.rowContent}>
                        <View style={s.rowTop}>
                          <Text style={[s.rowDate, { color: text }]}>
                            {formatDateShort(evt.date)}
                          </Text>
                          <Text style={[s.rowStatus, { color }]}>
                            {statusLabel(evt.status, evt.delayMinutes)}
                          </Text>
                        </View>
                        <View style={s.rowBottom}>
                          <Ionicons name="business-outline" size={11} color={muted} />
                          <Text style={[s.rowMeta, { color: muted }]}>{evt.environmentCode}</Text>
                          {evt.entryTime ? (
                            <>
                              <Text style={[s.rowMeta, { color: muted }]}>·</Text>
                              <Ionicons name="time-outline" size={11} color={muted} />
                              <Text style={[s.rowMeta, { color: muted }]}>{evt.entryTime}</Text>
                              {evt.exitTime
                                ? <Text style={[s.rowMeta, { color: muted }]}>→ {evt.exitTime}</Text>
                                : null}
                            </>
                          ) : null}
                        </View>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={muted}
                      />
                    </TouchableOpacity>

                    {/* Panel de detalle expandido */}
                    {isExpanded && (
                      <View style={[s.detailPanel, { backgroundColor: theme.primary + '08', borderColor: border }]}>
                        <DetailRow icon="calendar-outline"  label={t('attendance.dateLabel')}        value={formatDateLong(evt.date)}                  textColor={text}          mutedColor={muted} />
                        {evt.entryTime   ? <DetailRow icon="log-in-outline"   label={t('attendance.fields.entryTime')}     value={evt.entryTime}                             textColor={text}          mutedColor={muted} /> : null}
                        {evt.exitTime    ? <DetailRow icon="log-out-outline"  label={t('attendance.fields.exitTime')}      value={evt.exitTime}                              textColor={text}          mutedColor={muted} /> : null}
                        {evt.durationMin !== null
                          ? <DetailRow icon="hourglass-outline" label={t('attendance.timeInClass')} value={formatDuration(evt.durationMin)}             textColor={text}          mutedColor={muted} />
                          : null}
                        {evt.scheduleStart !== '—'
                          ? <DetailRow icon="time-outline"      label={t('attendance.scheduledHours')} value={`${evt.scheduleStart} – ${evt.scheduleEnd}`} textColor={text}      mutedColor={muted} />
                          : null}
                        <DetailRow icon="business-outline"  label={t('attendance.environmentLabel')} value={evt.environmentCode}                        textColor={text}          mutedColor={muted} />
                        <DetailRow icon="person-outline"    label={t('attendance.instructorLabel')}  value={evt.instructorName}                         textColor={text}          mutedColor={muted} />
                        {evt.status === 'late' && evt.delayMinutes > 0
                          ? <DetailRow icon="alert-circle-outline" label={t('attendance.fields.delay')} value={`${evt.delayMinutes} min`}               textColor={Colors.warning} mutedColor={muted} />
                          : null}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Componente auxiliar fila de detalle ───────
interface DetailRowProps {
  icon:       keyof typeof Ionicons.glyphMap;
  label:      string;
  value:      string;
  textColor:  string;
  mutedColor: string;
}
function DetailRow({ icon, label, value, textColor, mutedColor }: DetailRowProps) {
  return (
    <View style={s.detailRow}>
      <Ionicons name={icon} size={14} color={mutedColor} style={{ marginTop: 1 }} />
      <Text style={[s.detailLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[s.detailValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
//  ESTILOS
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },

  // Estadísticas
  statsCard:    { borderRadius: 14, borderWidth: 1, padding: 16, margin: 16, marginBottom: 0 },
  statsRow:     { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:     { alignItems: 'center', gap: 4, flex: 1 },
  statHighlight:{ borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 4 },
  statValue:    { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statLabel:    { fontSize: FontSize.xs, textAlign: 'center' },
  delayRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  delayText:    { fontSize: FontSize.xs },

  // Filtros
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip:   { borderRadius: 20, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 6 },

  // Vacío
  empty:     { alignItems: 'center', paddingVertical: 56, gap: 12, paddingHorizontal: 24 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },

  // Bloque de mes
  monthBlock: {
    marginHorizontal: 16, marginTop: 10,
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  monthHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  monthHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  monthTitle:      { fontSize: FontSize.base, fontWeight: FontWeight.black },
  monthCount:      { fontSize: FontSize.xs },
  monthBadges:     { flexDirection: 'row', gap: 4 },
  miniBadge:       { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  miniBadgeText:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  // Divisor entre filas
  divider: { height: 1, marginLeft: 14 },

  // Fila de evento
  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingRight: 12, gap: 10 },
  rowBar:     { width: 4, alignSelf: 'stretch', borderRadius: 2, marginLeft: 4 },
  rowIcon:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowDate:    { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  rowStatus:  { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  rowBottom:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
  rowMeta:    { fontSize: FontSize.xs },

  // Panel de detalle expandido
  detailPanel: { marginHorizontal: 4, marginBottom: 4, marginTop: 2, borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  detailRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  detailLabel: { fontSize: FontSize.xs, width: 90, flexShrink: 0 },
  detailValue: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flex: 1 },
});
