import { useMemo, useState, useSyncExternalStore } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAttendance } from '@/features/attendance/useAttendance';
import { getFichasSnapshot, getProgramsSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import { getSnapshot as getEnvironmentsSnapshot, subscribe as subscribeEnvironments } from '@/features/environments/environmentsStore';
import AppButton from '@/shared/components/ui/AppButton';
import SelectField from '@/shared/components/ui/SelectField';
import DateField from '@/shared/components/ui/DateField';
import { exportReport, generateReportData, type ExportOptions } from '@/shared/utils/export';

type Filters = { userId: string; ficha: string; environment: string; program: string; dateFrom: string; dateTo: string };
const EMPTY: Filters = { userId: '', ficha: '', environment: '', program: '', dateFrom: '', dateTo: '' };
const duration = (entry: string, exit: string) => {
  if (!/^\d{2}:\d{2}$/.test(entry) || !/^\d{2}:\d{2}$/.test(exit)) return '--';
  const [eh, em] = entry.split(':').map(Number); const [xh, xm] = exit.split(':').map(Number);
  let minutes = xh * 60 + xm - eh * 60 - em; if (minutes < 0) minutes += 1440;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

export default function ReportByUserScreen() {
  const { theme, isDark } = useTheme(); const { t } = useTranslation(); const attendance = useAttendance();
  const fichas = useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  const programs = useSyncExternalStore(subscribeAcademic, getProgramsSnapshot);
  const environments = useSyncExternalStore(subscribeEnvironments, getEnvironmentsSnapshot);
  const [filters, setFilters] = useState<Filters>(EMPTY); const [applied, setApplied] = useState<Filters>(EMPTY); const [dateError, setDateError] = useState('');
  const text = isDark ? Colors.dark.text : Colors.light.text; const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const card = isDark ? Colors.dark.card : Colors.light.card; const border = isDark ? Colors.dark.border : Colors.light.border; const bg = isDark ? Colors.dark.background : Colors.light.background;
  const users = useMemo(() => Array.from(new Map(attendance.map(r => [r.userId, r.userName])).entries()).map(([value, label]) => ({ value, label })), [attendance]);
  const fichaOptions = useMemo(() => fichas.filter(f => attendance.some(r => r.fichaNumber === f.number)).map(f => ({ value: f.number, label: f.number })), [attendance, fichas]);
  const environmentOptions = useMemo(() => environments.filter(e => attendance.some(r => r.environmentName === e.code)).map(e => ({ value: e.code, label: e.code })), [attendance, environments]);
  const programOptions = useMemo(() => programs.filter(p => attendance.some(r => r.programId === p.id)).map(p => ({ value: p.id, label: p.name })), [attendance, programs]);
  const results = useMemo(() => attendance.filter(r => (!applied.userId || r.userId === applied.userId) && (!applied.ficha || r.fichaNumber === applied.ficha) && (!applied.environment || r.environmentName === applied.environment) && (!applied.program || r.programId === applied.program) && (!applied.dateFrom || r.date >= applied.dateFrom) && (!applied.dateTo || r.date <= applied.dateTo)).sort((a, b) => b.date.localeCompare(a.date)), [attendance, applied]);
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters(current => ({ ...current, [key]: value }));
  const apply = () => { if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) { setDateError(t('reports.invalidDateRange')); return; } setDateError(''); setApplied(filters); };
  const clear = () => { setFilters(EMPTY); setApplied(EMPTY); setDateError(''); };
  const exportCurrent = async (format: 'pdf' | 'excel') => {
    if (!results.length) return;
    const data = generateReportData('by-user', results, { user: users.find(x => x.value === applied.userId)?.label || '', ficha: applied.ficha, environment: applied.environment, program: programOptions.find(x => x.value === applied.program)?.label || '', dateFrom: applied.dateFrom, dateTo: applied.dateTo }, t);
    await exportReport(data, { filename: `reporte-usuario-${new Date().toISOString().slice(0, 10)}`, format } as ExportOptions);
  };
  const colorFor = (status: string) => status === 'punctual' ? Colors.success : status === 'late' ? Colors.warning : status === 'absent' ? Colors.error : Colors.info;
  const options = (items: { value: string; label: string }[]) => [{ value: '', label: t('reports.filters.all') }, ...items];
  return <View style={[s.safe, { backgroundColor: bg }]}><FlatList data={results} keyExtractor={x => x.id} contentContainerStyle={s.list}
    ListHeaderComponent={<>
      <View style={s.header}><TouchableOpacity onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={22} color={text} /></TouchableOpacity><Text style={[s.title, { color: text }]}>{t('reports.byUser')}</Text></View>
      <View style={[s.box, { backgroundColor: card, borderColor: border }]}><View style={s.section}><Ionicons name="filter-outline" size={18} color={theme.primary} /><Text style={[s.sectionText, { color: text }]}>{t('reports.filtersTitle')}</Text></View><View style={s.fields}>
        <SelectField label={t('reports.filters.user')} value={filters.userId} options={options(users)} onSelect={v => update('userId', v)} placeholder={t('reports.filters.all')} containerStyle={s.field} />
        <DateField label={t('reports.filters.dateFrom')} value={filters.dateFrom} onChange={v => update('dateFrom', v)} placeholder="YYYY-MM-DD" containerStyle={s.field} />
        <DateField label={t('reports.filters.dateTo')} value={filters.dateTo} onChange={v => update('dateTo', v)} minDate={filters.dateFrom || undefined} error={dateError} placeholder="YYYY-MM-DD" containerStyle={s.field} />
        <SelectField label={t('reports.filters.ficha')} value={filters.ficha} options={options(fichaOptions)} onSelect={v => update('ficha', v)} placeholder={t('reports.filters.all')} containerStyle={s.field} />
        <SelectField label={t('reports.filters.environment')} value={filters.environment} options={options(environmentOptions)} onSelect={v => update('environment', v)} placeholder={t('reports.filters.all')} containerStyle={s.field} />
        <SelectField label={t('reports.filters.program')} value={filters.program} options={options(programOptions)} onSelect={v => update('program', v)} placeholder={t('reports.filters.all')} containerStyle={s.field} />
      </View><View style={s.actions}><AppButton title={t('reports.actions.filter')} onPress={apply} fullWidth={false} style={s.button} /><AppButton title={t('reports.actions.clear')} onPress={clear} variant="outline" fullWidth={false} style={s.button} /></View></View>
      <View style={[s.box, { backgroundColor: card, borderColor: border }]}><Text style={[s.sectionText, { color: text }]}>{t('reports.summary.totalRecords')}: {results.length}</Text><View style={s.actions}><AppButton title={t('reports.export.pdf')} onPress={() => exportCurrent('pdf')} disabled={!results.length} fullWidth={false} style={s.button} /><AppButton title={t('reports.export.excel')} onPress={() => exportCurrent('excel')} variant="outline" disabled={!results.length} fullWidth={false} style={s.button} /></View></View>
      <Text style={[s.results, { color: text }]}>{t('reports.results')}</Text>
    </>}
    renderItem={({ item }) => { const absent = item.status === 'absent'; return <View style={[s.box, { backgroundColor: card, borderColor: border }]}><View style={s.cardHead}><Text style={[s.name, { color: text }]}>{item.userName}</Text><View style={[s.badge, { backgroundColor: colorFor(item.status) + '18' }]}><Text style={[s.badgeText, { color: colorFor(item.status) }]}>{t(`attendance.statuses.${item.status}`)}</Text></View></View><View style={s.meta}><Text style={{ color: muted }}>{t('reports.table.date')}: {item.date}</Text><Text style={{ color: muted }}>{t('reports.table.ficha')}: {item.fichaNumber}</Text><Text style={{ color: muted }}>{t('reports.filters.program')}: {item.programName}</Text><Text style={{ color: muted }}>{t('reports.table.env')}: {item.environmentName}</Text><Text style={{ color: muted }}>{t('reports.table.entry')}: {absent ? '—' : item.entryTime || '—'}</Text><Text style={{ color: muted }}>{t('reports.table.exit')}: {absent ? '—' : item.exitTime || '—'}</Text><Text style={{ color: item.status === 'late' ? Colors.warning : muted }}>{t('reports.table.delay')}: {item.status === 'late' ? `${item.delayMinutes} min` : '—'}</Text><Text style={{ color: muted }}>{t('reports.table.duration')}: {absent ? '—' : duration(item.entryTime, item.exitTime)}</Text></View></View>; }}
    ListEmptyComponent={<View style={s.empty}><Ionicons name="document-text-outline" size={32} color={muted} /><Text style={[s.emptyText, { color: muted }]}>{t('reports.noRecords')}</Text></View>} /></View>;
}

const s = StyleSheet.create({ safe: { flex: 1 }, list: { padding: 16, gap: 10, paddingBottom: 32 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }, title: { flex: 1, fontSize: FontSize['2xl'], fontWeight: FontWeight.black }, box: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 2 }, section: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }, sectionText: { fontSize: FontSize.base, fontWeight: FontWeight.black }, fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, field: { flexGrow: 1, flexBasis: 220, minWidth: 180 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }, button: { minWidth: 160, flexGrow: 1 }, results: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginTop: 4, marginBottom: 2 }, cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }, name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, flex: 1 }, badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }, badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold }, meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, empty: { alignItems: 'center', paddingVertical: 56 }, emptyText: { marginTop: 10, fontSize: FontSize.base } });
