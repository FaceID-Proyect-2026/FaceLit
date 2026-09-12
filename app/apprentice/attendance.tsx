// ─────────────────────────────────────────────
//  app/apprentice/attendance.tsx
//  Mi Asistencia — Aprendiz
//  Vista de lista estilo bandeja (RF-6.1, RF-6.2,
//  RF-7.1, RF-7.3). Solo lectura, solo datos propios.
// ─────────────────────────────────────────────
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { ATTENDANCE_EVENTS, AttendanceStatus } from '@/features/attendance/types';
import { getSchedulesSnapshot } from '@/features/schedules/schedulesStore';
import { getSnapshot as getEnvironmentsSnapshot } from '@/features/environments/environmentsStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

// ── Helpers ────────────────────────────────────
const STATUS_COLOR: Record<AttendanceStatus, string> = {
  punctual:   Colors.success,
  late:       Colors.warning,
  absent:     Colors.error,
  invalidEnv: '#9B59B6',
};

const STATUS_ICON: Record<AttendanceStatus, string> = {
  punctual:   'checkmark-circle',
  late:       'time',
  absent:     'close-circle',
  invalidEnv: 'alert-circle',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

// Month selector options — last 6 months + "all"
function buildMonthOptions(): { label: string; value: string }[] {
  const opts: { label: string; value: string }[] = [{ label: 'Todos', value: 'all' }];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({
      label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return opts;
}

export default function ApprenticeAttendanceScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  const text   = isDark ? Colors.dark.text       : Colors.light.text;
  const muted  = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14'              : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)': 'rgba(101,179,97,0.20)';
  const rowDiv = isDark ? 'rgba(255,255,255,0.05)': 'rgba(0,0,0,0.05)';
  const bg     = isDark ? Colors.dark.background : Colors.light.background;

  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const months = useMemo(buildMonthOptions, []);

  // ── Datos del aprendiz ─────────────────────
  const schedules    = getSchedulesSnapshot();
  const environments = getEnvironmentsSnapshot();

  const myEvents = useMemo(() => {
    const raw = ATTENDANCE_EVENTS.filter(e => e.userId === user?.id);
    if (selectedMonth === 'all') return raw;
    return raw.filter(e => e.date.startsWith(selectedMonth));
  }, [user?.id, selectedMonth]);

  // ── Estadísticas del período ───────────────
  const stats = useMemo(() => {
    const total     = myEvents.length;
    const punctual  = myEvents.filter(e => e.status === 'punctual').length;
    const late      = myEvents.filter(e => e.status === 'late').length;
    const absent    = myEvents.filter(e => e.status === 'absent').length;
    const pct       = total > 0 ? Math.round(((punctual + late) / total) * 100) : 0;
    const totalDelay= myEvents.reduce((acc, e) => acc + (e.delayMinutes ?? 0), 0);
    return { total, punctual, late, absent, pct, totalDelay };
  }, [myEvents]);

  // ── Resolver nombre del ambiente ───────────
  function resolveEnv(scheduleId: string): string {
    const sch = schedules.find(s => s.id === scheduleId);
    if (!sch) return '—';
    const env = environments.find(e => e.id === sch.environmentId);
    return env?.code ?? env?.name ?? '—';
  }

  function resolveTime(scheduleId: string): string {
    const sch = schedules.find(s => s.id === scheduleId);
    return sch ? `${sch.startTime} – ${sch.endTime}` : '—';
  }

  // ── Status label ──────────────────────────
  function statusLabel(status: AttendanceStatus, delay: number): string {
    if (status === 'late')  return `${t('attendance.late')} · ${delay} min`;
    if (status === 'absent') return t('attendance.absent');
    if (status === 'invalidEnv') return t('attendance.statuses.invalidEnv', 'Amb. incorrecto');
    return t('attendance.punctual');
  }

  const sorted = [...myEvents].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={[s.safe, { backgroundColor: bg }]}>

      {/* Header */}
      <View style={[s.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={22} color={text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: text }]}>{t('sidebar.myAttendance')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Resumen estadístico */}
        <View style={[s.statsCard, { backgroundColor: cardBg, borderColor: border, margin: 16, marginBottom: 0 }]}>
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
            <View style={[s.statItem, s.statItemHighlight, { borderColor: theme.primary + '40' }]}>
              <Ionicons name="bar-chart-outline" size={20} color={theme.primary} />
              <Text style={[s.statValue, { color: text }]}>{stats.pct}%</Text>
              <Text style={[s.statLabel, { color: muted }]}>{t('dashboard.attendanceRate')}</Text>
            </View>
          </View>
        </View>

        {/* Filtro de mes */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterScroll}
        >
          {months.map(m => (
            <TouchableOpacity
              key={m.value}
              onPress={() => setSelectedMonth(m.value)}
              style={[
                s.filterChip,
                {
                  backgroundColor: selectedMonth === m.value ? theme.primary + '20' : 'transparent',
                  borderColor:     selectedMonth === m.value ? theme.primary        : border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ color: selectedMonth === m.value ? theme.primary : muted, fontWeight: '700', fontSize: 12 }}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista estilo Gmail */}
        <View style={[s.listCard, { backgroundColor: cardBg, borderColor: border, margin: 16, marginTop: 8 }]}>
          {sorted.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={muted} />
              <Text style={[s.emptyText, { color: muted }]}>{t('attendance.empty')}</Text>
            </View>
          ) : (
            sorted.map((item, idx) => {
              const color = STATUS_COLOR[item.status];
              const icon  = STATUS_ICON[item.status];
              const envName = resolveEnv(item.scheduleId);
              const time    = resolveTime(item.scheduleId);
              return (
                <View
                  key={item.id}
                  style={[
                    s.row,
                    idx < sorted.length - 1 && { borderBottomWidth: 1, borderBottomColor: rowDiv },
                  ]}
                >
                  {/* Indicador lateral de color */}
                  <View style={[s.rowBar, { backgroundColor: color }]} />

                  {/* Icono */}
                  <View style={[s.rowIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon as any} size={18} color={color} />
                  </View>

                  {/* Contenido */}
                  <View style={s.rowContent}>
                    <View style={s.rowTop}>
                      <Text style={[s.rowDate, { color: text }]}>{formatDate(item.date)}</Text>
                      <Text style={[s.rowStatus, { color }]}>{statusLabel(item.status, item.delayMinutes)}</Text>
                    </View>
                    <View style={s.rowBottom}>
                      <Ionicons name="business-outline" size={12} color={muted} />
                      <Text style={[s.rowMeta, { color: muted }]}>{envName}</Text>
                      {item.entryTime ? (
                        <>
                          <Text style={[s.rowMeta, { color: muted }]}>·</Text>
                          <Ionicons name="time-outline" size={12} color={muted} />
                          <Text style={[s.rowMeta, { color: muted }]}>{item.entryTime}</Text>
                          {item.exitTime ? <Text style={[s.rowMeta, { color: muted }]}>→ {item.exitTime}</Text> : null}
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },

  // Stats
  statsCard:  { borderRadius: 14, borderWidth: 1, padding: 16 },
  statsRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  statItem:   { alignItems: 'center', gap: 4, flex: 1 },
  statItemHighlight: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 4 },
  statValue:  { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statLabel:  { fontSize: FontSize.xs, textAlign: 'center' },

  // Filter chips
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { borderRadius: 20, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 6 },

  // List
  listCard:   { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    gap: 10,
  },
  rowBar:     { width: 4, alignSelf: 'stretch', borderRadius: 2, marginLeft: 4 },
  rowIcon: {
    width: 34, height: 34,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowDate:    { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  rowStatus:  { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  rowBottom:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  rowMeta:    { fontSize: FontSize.xs },

  // Empty
  empty:     { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: FontSize.base },
});
