// ─────────────────────────────────────────────
//  app/admin/attendance/history.tsx
//  RF-6.3 — Historial de asistencia tipo bandeja
//
//  Lista de tarjetas agrupadas por ficha,
//  búsqueda por fecha / nombre / documento.
//  Al tocar una tarjeta se expande el detalle.
// ─────────────────────────────────────────────
import { useAttendanceRF6, type HistoryCard } from '@/features/attendance/useAttendanceRF6';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Section = { fichaId: string; fichaNumber: string; data: HistoryCard[] };

export default function AttendanceHistoryScreen() {
  const { isDark, theme } = useTheme();
  const { t, i18n }       = useTranslation();
  const { getHistory }    = useAttendanceRF6();

  const text    = isDark ? Colors.dark.text    : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = isDark ? '#0D1F14'           : Colors.white;
  const border  = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg      = isDark ? Colors.dark.background : Colors.light.background;
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';

  // ── Estado ────────────────────────────────
  const [nameOrDoc,   setNameOrDoc]   = useState('');
  const [dateFilter,  setDateFilter]  = useState('');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);

  // ── Filtrado y agrupación ─────────────────
  const sections: Section[] = useMemo(() => {
    const cards = getHistory({
      nameOrDoc: nameOrDoc.trim() || undefined,
      date:      dateFilter.trim() || undefined,
    });

    // Agrupar por fichaId manteniendo orden de aparición
    const map = new Map<string, Section>();
    for (const card of cards) {
      if (!map.has(card.fichaId)) {
        map.set(card.fichaId, { fichaId: card.fichaId, fichaNumber: card.fichaNumber, data: [] });
      }
      map.get(card.fichaId)!.data.push(card);
    }
    return Array.from(map.values());
  }, [getHistory, nameOrDoc, dateFilter]);

  const totalCards = useMemo(() => sections.reduce((n, s) => n + s.data.length, 0), [sections]);

  // ── Formato ───────────────────────────────
  const fmtDateLong = (d: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'long' }).format(
      new Date(`${d}T12:00:00Z`),
    );
  const fmtTime = (v: string) =>
    v
      ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true }).format(
          new Date(`1970-01-01T${v}:00`),
        )
      : '—';

  const statusConfig = {
    punctual: { color: Colors.success, icon: 'checkmark-circle' as const, label: t('attendance.statuses.punctual') },
    late:     { color: Colors.warning, icon: 'time'             as const, label: t('attendance.statuses.late') },
    absent:   { color: Colors.error,   icon: 'close-circle'     as const, label: t('attendance.statuses.absent') },
    invalidEnv: { color: Colors.info,  icon: 'alert-circle'     as const, label: t('attendance.statuses.invalidEnv') },
  };

  // ── Render de una tarjeta ─────────────────
  const renderCard = (card: HistoryCard) => {
    const cfg      = statusConfig[card.status] ?? statusConfig.absent;
    const expanded = expandedId === card.id;
    const isAnomaly = card.status === 'absent' || card.status === 'late';

    return (
      <TouchableOpacity
        key={card.id}
        activeOpacity={0.75}
        onPress={() => setExpandedId(expanded ? null : card.id)}
        style={[s.histCard, { backgroundColor: cardBg, borderColor: isAnomaly ? cfg.color + '50' : border }]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        {/* Franja de estado */}
        <View style={[s.stripe, { backgroundColor: cfg.color }]} />

        <View style={s.cardBody}>
          {/* Fila principal */}
          <View style={s.cardMain}>
            <View style={[s.avatar, { backgroundColor: theme.primary + '20' }]}>
              <Text style={[s.avatarText, { color: theme.primary }]}>
                {card.learnerName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardName, { color: text }]} numberOfLines={1}>{card.learnerName}</Text>
              <Text style={[s.cardDoc, { color: muted }]}>{card.learnerDocument}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: cfg.color + '18' }]}>
              <Ionicons name={cfg.icon} size={12} color={cfg.color} />
              <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Info rápida */}
          <View style={s.cardMeta}>
            <View style={s.metaItem}>
              <Ionicons name="calendar-outline" size={12} color={muted} />
              <Text style={[s.metaText, { color: muted }]}>{fmtDateLong(card.date)}</Text>
            </View>
            {card.entryTime && (
              <View style={s.metaItem}>
                <Ionicons name="log-in-outline" size={12} color={muted} />
                <Text style={[s.metaText, { color: muted }]}>{fmtTime(card.entryTime)}</Text>
              </View>
            )}
            {card.delayMinutes > 0 && (
              <View style={[s.delayChip, { backgroundColor: Colors.warning + '18' }]}>
                <Ionicons name="alarm-outline" size={11} color={Colors.warning} />
                <Text style={[s.delayText, { color: Colors.warning }]}>{card.delayMinutes} min</Text>
              </View>
            )}
          </View>

          {/* Detalle expandido */}
          {expanded && (
            <View style={[s.expanded, { borderTopColor: border }]}>
              {[
                ['business-outline',      t('attendance.fields.environment'), card.environmentName || '—'],
                ['person-circle-outline', t('attendance.fields.instructor'),  card.instructorName  || '—'],
                ['school-outline',        t('attendance.fields.program'),     card.programName     || '—'],
              ].map(([icon, label, value]) => (
                <View key={String(label)} style={s.expandRow}>
                  <View style={s.expandLabel}>
                    <Ionicons name={icon as any} size={13} color={muted} />
                    <Text style={[s.expandLabelText, { color: muted }]}>{label}</Text>
                  </View>
                  <Text style={[s.expandValue, { color: text }]}>{value}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ── Render ────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {/* Barra de filtros */}
      <View style={[s.filterBar, { backgroundColor: cardBg, borderBottomColor: border }]}>
        {/* Nombre / documento */}
        <View style={[s.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
          <Ionicons name="search-outline" size={16} color={muted} />
          <TextInput
            style={[s.searchInput, { color: text }] as any}
            value={nameOrDoc}
            onChangeText={setNameOrDoc}
            placeholder={t('attendance.rf6.filterNameDoc')}
            placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          />
          {nameOrDoc.length > 0 && (
            <TouchableOpacity onPress={() => setNameOrDoc('')}>
              <Ionicons name="close-circle" size={16} color={muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Fecha */}
        <View style={[s.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
          <Ionicons name="calendar-outline" size={16} color={muted} />
          <TextInput
            style={[s.searchInput, { color: text }] as any}
            value={dateFilter}
            onChangeText={setDateFilter}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
            maxLength={10}
          />
          {dateFilter.length > 0 && (
            <TouchableOpacity onPress={() => setDateFilter('')}>
              <Ionicons name="close-circle" size={16} color={muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Contador */}
        <Text style={[s.counter, { color: muted }]}>
          {totalCards} {t('attendance.rf6.records')}
        </Text>
      </View>

      {/* Lista por secciones */}
      {sections.length === 0 ? (
        <View style={s.emptyBox}>
          <Ionicons name="file-tray-outline" size={40} color={muted} />
          <Text style={[s.emptyText, { color: muted }]}>{t('attendance.rf6.noHistoryResults')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={[s.sectionHeader, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '30' }]}>
              <Ionicons name="people-outline" size={15} color={theme.primary} />
              <Text style={[s.sectionTitle, { color: theme.primary }]}>
                {t('attendance.rf6.ficha')} {section.fichaNumber}
              </Text>
              <View style={[s.sectionCount, { backgroundColor: theme.primary + '30' }]}>
                <Text style={[s.sectionCountText, { color: theme.primary }]}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => renderCard(item)}
        />
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, paddingBottom: 48 },

  filterBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, gap: 8 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,
  counter:    { fontSize: FontSize.xs, textAlign: 'right', marginBottom: 4 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8, marginTop: 16 },
  sectionTitle:  { fontSize: FontSize.sm, fontWeight: FontWeight.black, flex: 1 },
  sectionCount:  { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  sectionCountText: { fontSize: FontSize.xs, fontWeight: FontWeight.black },

  histCard:  { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  stripe:    { width: 4 },
  cardBody:  { flex: 1, padding: 12 },
  cardMain:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: FontWeight.black, fontSize: FontSize.sm },
  cardName:  { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardDoc:   { fontSize: FontSize.xs },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: FontWeight.bold },

  cardMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  metaItem:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:  { fontSize: FontSize.xs },
  delayChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  delayText: { fontSize: 11, fontWeight: FontWeight.bold },

  expanded:    { marginTop: 10, paddingTop: 10, borderTopWidth: 1, gap: 6 },
  expandRow:   { flexDirection: 'row', alignItems: 'center' },
  expandLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  expandLabelText: { fontSize: FontSize.xs },
  expandValue: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, flex: 1, textAlign: 'right' },

  emptyBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },
});
