// ─────────────────────────────────────────────
//  app/admin/attendance/index.tsx — Control de Asistencia (Admin)
//
//  Flujo: el administrador primero elige un Programa de Formación,
//  luego una Ficha de ese programa, y solo entonces se muestran los
//  resultados del control de asistencia de esa ficha (estadísticas,
//  búsqueda y listado). Antes de completar la selección se muestra
//  un estado vacío que invita a elegir programa y ficha.
// ─────────────────────────────────────────────
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { AttendanceStatus } from '@/features/attendance/types';
import { useAttendance } from '@/features/attendance/useAttendance';
import { SearchableSelect } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// RF-6.4: el admin/coordinador consulta asistencias de una ficha puntual,
// elegida a través de su programa de formación. "Anomalías" (invalidEnv)
// queda fuera del alcance de este panel — solo puntual/retraso/inasistencia.
const FILTERS: AttendanceStatus[] = ['punctual', 'late', 'absent'];

export default function AttendanceListScreen() {
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const records = useAttendance();
  const { programs, allFichas } = useAcademic();

  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedFichaId, setSelectedFichaId] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | null>(null);
  const [search, setSearch] = useState('');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const statusConfig: Record<AttendanceStatus, { color: string; icon: string; label: string }> = {
    punctual: { color: Colors.success, icon: 'checkmark-circle', label: t('attendance.statuses.punctual') },
    late: { color: Colors.warning, icon: 'time', label: t('attendance.statuses.late') },
    absent: { color: Colors.error, icon: 'close-circle', label: t('attendance.statuses.absent') },
    invalidEnv: { color: Colors.info, icon: 'alert-circle', label: t('attendance.statuses.invalidEnv') },
  };

  const programOptions = programs.map(p => ({ value: p.id, label: getProgramDisplayName(p, t), sublabel: `${p.fichas.length} ${t('academic.fichas').toLowerCase()}` }));
  const fichasInProgram = useMemo(
    () => allFichas.filter(f => f.programId === selectedProgramId),
    [allFichas, selectedProgramId]
  );
  const fichaOptions = fichasInProgram.map(f => ({ value: f.id, label: `Ficha ${f.number}`, sublabel: f.code }));

  const fichaRecords = useMemo(
    () => (selectedFichaId ? records.filter(r => r.fichaId === selectedFichaId) : []),
    [records, selectedFichaId]
  );

  const visibleRecords = useMemo(() => {
    let list = statusFilter ? fichaRecords.filter(record => record.status === statusFilter) : fichaRecords;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r => r.userName.toLowerCase().includes(q) || r.userDocument.includes(q) || r.fichaNumber.includes(q));
    }
    return list;
  }, [fichaRecords, statusFilter, search]);

  const stats = {
    total: fichaRecords.length,
    punctual: fichaRecords.filter(record => record.status === 'punctual').length,
    late: fichaRecords.filter(record => record.status === 'late').length,
    absent: fichaRecords.filter(record => record.status === 'absent').length,
  };

  const formatDate = (value: string) => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
  const formatTime = (value: string) => value ? new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(`1970-01-01T${value}:00`)) : '—';

  const ready = !!selectedProgramId && !!selectedFichaId;

  return (
    <FlatList
      style={[als.safe, { backgroundColor: bg }]}
      contentContainerStyle={als.scrollContent}
      keyboardShouldPersistTaps="handled"
      data={ready ? visibleRecords : []}
      keyExtractor={record => record.id}
      ListHeaderComponent={
        <View>
          <Text style={[als.title, { color: text }]}>{t('attendance.title')}</Text>
          <Text style={[als.subtitle, { color: muted }]}>{t('attendance.adminSubtitle')}</Text>

          <View style={[als.selectorCard, { backgroundColor: cardBg, borderColor: border }]}>
            <SearchableSelect
              label={t('attendance.selectProgram')}
              value={selectedProgramId}
              options={programOptions}
              onSelect={v => { setSelectedProgramId(v); setSelectedFichaId(''); }}
              placeholder={t('attendance.selectProgramPlaceholder')}
              emptyText={t('attendance.noProgramsFound', 'No se encontraron programas con ese nombre')}
            />
            <SearchableSelect
              label={t('attendance.selectFicha')}
              value={selectedFichaId}
              options={fichaOptions}
              onSelect={setSelectedFichaId}
              placeholder={selectedProgramId ? t('attendance.selectFichaPlaceholder') : t('attendance.selectProgramFirst', 'Primero selecciona un programa')}
              disabled={!selectedProgramId}
              emptyText={t('attendance.noFichasInProgram')}
            />
            {selectedProgramId && fichaOptions.length === 0 && (
              <Text style={[als.hint, { color: Colors.warning }]}>{t('attendance.noFichasInProgram')}</Text>
            )}
          </View>

          {!ready ? (
            <View style={als.prompt}>
              <View style={[als.promptIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="people-outline" size={32} color={theme.primary} />
              </View>
              <Text style={[als.promptText, { color: muted }]}>{t('attendance.selectPrompt')}</Text>
            </View>
          ) : (
            <>
              <View style={als.statsRow}>
                {[
                  { v: stats.total, l: t('attendance.stats.total'), c: theme.primary, icon: 'list-outline' },
                  { v: stats.punctual, l: t('attendance.stats.punctual'), c: Colors.success, icon: 'checkmark-circle-outline' },
                  { v: stats.late, l: t('attendance.stats.late'), c: Colors.warning, icon: 'time-outline' },
                  { v: stats.absent, l: t('attendance.stats.absent'), c: Colors.error, icon: 'close-circle-outline' },
                ].map(stat => (
                  <View key={stat.l} style={[als.stat, { borderColor: border, backgroundColor: cardBg }]}>
                    <View style={[als.statIcon, { backgroundColor: stat.c + '18' }]}>
                      <Ionicons name={stat.icon as any} size={16} color={stat.c} />
                    </View>
                    <Text style={[als.statV, { color: stat.c }]}>{stat.v}</Text>
                    <Text style={[als.statL, { color: muted }]}>{stat.l}</Text>
                  </View>
                ))}
              </View>

              <View style={[als.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
                <Ionicons name="search-outline" size={17} color={muted} />
                <TextInput style={[als.searchInput, { color: text }] as any} value={search} onChangeText={setSearch}
                  placeholder={t('attendance.searchPlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
              </View>

              <View style={als.filterRow} accessibilityRole="tablist">
                {FILTERS.map(status => {
                  const config = statusConfig[status];
                  const selected = statusFilter === status;
                  return (
                    <TouchableOpacity key={status} accessibilityRole="tab" accessibilityState={{ selected }} activeOpacity={0.7}
                      onPress={() => setStatusFilter(selected ? null : status)}
                      style={[als.filter, { borderColor: selected ? config.color : border, backgroundColor: selected ? config.color + '18' : inputBg }]}>
                      <Ionicons name={config.icon as any} size={14} color={selected ? config.color : muted} />
                      <Text style={[als.filterText, { color: selected ? config.color : muted }]}>{config.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const config = statusConfig[item.status];
        return (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${t('attendance.detail')}: ${item.userName}`}
            onPress={() => router.push(`/admin/attendance/${item.id}`)}
            style={[als.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
            <View style={[als.statusStripe, { backgroundColor: config.color }]} />
            <View style={als.cardBody}>
              <View style={als.cardHeader}>
                <View style={[als.avatar, { backgroundColor: theme.primary + '18' }]}>
                  <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>{item.userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[als.cardUser, { color: text }]} numberOfLines={1}>{item.userName}</Text>
                  <Text style={{ color: muted, fontSize: 12 }}>{item.userDocument}</Text>
                </View>
                <View style={[als.statusBadge, { backgroundColor: config.color + '18' }]}>
                  <Ionicons name={config.icon as any} size={13} color={config.color} />
                  <Text style={{ color: config.color, fontWeight: '700', fontSize: 12 }}>{config.label}</Text>
                </View>
              </View>

              <View style={[als.cardDivider, { borderColor: border }]} />

              <View style={als.cardInfoRow}>
                <View style={als.cardInfoItem}>
                  <Ionicons name="calendar-outline" size={13} color={muted} />
                  <Text style={{ color: muted, fontSize: 12 }}>{formatDate(item.date)}</Text>
                </View>
                <View style={als.cardInfoItem}>
                  <Ionicons name="log-in-outline" size={13} color={muted} />
                  <Text style={{ color: muted, fontSize: 12 }}>{formatTime(item.entryTime)}</Text>
                </View>
                <View style={als.cardInfoItem}>
                  <Ionicons name="business-outline" size={13} color={muted} />
                  <Text style={{ color: muted, fontSize: 12 }}>{item.environmentName}</Text>
                </View>
              </View>

              {item.delayMinutes > 0 && (
                <View style={[als.delayChip, { backgroundColor: Colors.warning + '18' }]}>
                  <Ionicons name="alarm-outline" size={12} color={Colors.warning} />
                  <Text style={{ color: Colors.warning, fontSize: 11, fontWeight: '700' }}>{t('attendance.fields.delay')}: {item.delayMinutes} min</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={ready ? <View style={als.empty}><Text style={{ color: muted }}>{t('attendance.empty')}</Text></View> : null}
    />
  );
}

const als = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6, paddingHorizontal: 16, paddingTop: 16 },
  subtitle: { fontSize: FontSize.sm, lineHeight: 19, paddingHorizontal: 16, marginBottom: 14 },

  selectorCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 14, borderWidth: 1, padding: 16, position: 'relative', zIndex: 5 },
  hint: { fontSize: FontSize.xs, marginTop: 2 },

  prompt: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  promptIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  promptText: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  stat: { flexGrow: 1, minWidth: 84, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center' },
  statIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statV: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statL: { fontSize: 10, marginTop: 2, textAlign: 'center' },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.2 },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  list: { paddingHorizontal: 16, paddingTop: 0, gap: 10, paddingBottom: 32 },
  card: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statusStripe: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardUser: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  cardDivider: { borderTopWidth: 1, marginVertical: 10 },
  cardInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cardInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  delayChip: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
