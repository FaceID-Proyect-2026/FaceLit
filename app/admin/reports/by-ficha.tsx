import { useMemo, useState, useSyncExternalStore } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAttendance } from '@/features/attendance/useAttendance';
import { getFichasSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import AppButton from '@/shared/components/ui/AppButton';
import SelectField from '@/shared/components/ui/SelectField';
import DateField from '@/shared/components/ui/DateField';
import { exportReport, generateReportData, type ExportOptions } from '@/shared/utils/export';

type LearnerStats = { id: string; name: string; document: string; totalClasses: number; attendances: number; absences: number; lateCount: number; percentage: number };
type FichaStats = { fichaNumber: string; learners: LearnerStats[]; totalClasses: number; attendances: number; absences: number; lateCount: number; percentage: number };

export default function ReportByFichaScreen() {
  const { theme, isDark } = useTheme(); const { t } = useTranslation(); const attendance = useAttendance();
  const fichas = useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  const [selectedFicha, setSelectedFicha] = useState(''); const [dateFrom, setDateFrom] = useState(''); const [dateTo, setDateTo] = useState(''); const [dateError, setDateError] = useState('');
  const text = isDark ? Colors.dark.text : Colors.light.text; const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const card = isDark ? Colors.dark.card : Colors.light.card; const border = isDark ? Colors.dark.border : Colors.light.border; const bg = isDark ? Colors.dark.background : Colors.light.background;
  const selected = fichas.find(ficha => ficha.number === selectedFicha);
  const fichaOptions = useMemo(() => fichas.map(ficha => ({ value: ficha.number, label: ficha.number })), [fichas]);
  const dateIsValid = !dateFrom || !dateTo || dateFrom <= dateTo;
  const records = useMemo(() => !selected ? [] : attendance.filter(record => record.fichaNumber === selected.number && (!dateFrom || record.date >= dateFrom) && (!dateTo || record.date <= dateTo)), [attendance, selected, dateFrom, dateTo]);
  const stats = useMemo((): FichaStats | null => {
    if (!selected) return null;
    const learners = selected.learners.map(learner => {
      const learnerRecords = records.filter(record => record.userId === learner.id);
      const attendances = learnerRecords.filter(record => record.status === 'punctual' || record.status === 'late').length;
      const lateCount = learnerRecords.filter(record => record.status === 'late').length;
      const absences = learnerRecords.filter(record => record.status === 'absent').length;
      const totalClasses = learnerRecords.length;
      return { id: learner.id, name: `${learner.name} ${learner.lastname}`, document: learner.document, totalClasses, attendances, lateCount, absences, percentage: totalClasses ? Math.round((attendances / totalClasses) * 100) : 0 };
    });
    const totals = learners.reduce((sum, learner) => ({ totalClasses: sum.totalClasses + learner.totalClasses, attendances: sum.attendances + learner.attendances, lateCount: sum.lateCount + learner.lateCount, absences: sum.absences + learner.absences }), { totalClasses: 0, attendances: 0, lateCount: 0, absences: 0 });
    return { fichaNumber: selected.number, learners, ...totals, percentage: totals.totalClasses ? Math.round((totals.attendances / totals.totalClasses) * 100) : 0 };
  }, [records, selected]);
  const applyDates = () => { if (!dateIsValid) { setDateError(t('reports.invalidDateRange')); return; } setDateError(''); };
  const clearFilters = () => { setDateFrom(''); setDateTo(''); setDateError(''); };
  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!stats || !stats.learners.length || !dateIsValid) return;
    await exportReport(generateReportData('by-ficha', stats, { dateFrom, dateTo }, t), { filename: `reporte-ficha-${stats.fichaNumber}-${new Date().toISOString().slice(0, 10)}`, format } as ExportOptions);
  };
  const totals = stats ? [
    { label: t('reports.summary.totalRecords'), value: stats.learners.length, color: theme.primary },
    { label: t('reports.summary.rate'), value: `${stats.percentage}%`, color: Colors.success },
    { label: t('reports.summary.lateCount'), value: stats.lateCount, color: Colors.warning },
    { label: t('reports.summary.absentCount'), value: stats.absences, color: Colors.error },
  ] : [];
  const chart = stats ? [{ label: t('reports.summary.present'), value: stats.attendances, color: Colors.success }, { label: t('reports.summary.lateCount'), value: stats.lateCount, color: Colors.warning }, { label: t('reports.summary.absentCount'), value: stats.absences, color: Colors.error }] : [];
  const maxChartValue = Math.max(1, ...chart.map(item => item.value));

  return <View style={[s.safe, { backgroundColor: bg }]}><FlatList data={stats?.learners || []} keyExtractor={item => item.id} contentContainerStyle={s.list}
    ListHeaderComponent={<>
      <View style={s.header}><TouchableOpacity onPress={() => router.back()} hitSlop={8}><Ionicons name="arrow-back" size={22} color={text} /></TouchableOpacity><Text style={[s.title, { color: text }]}>{t('reports.byFicha')}</Text></View>
      <View style={[s.box, { backgroundColor: card, borderColor: border }]}><View style={s.fields}>
        <SelectField label={t('reports.filters.ficha')} value={selectedFicha} options={fichaOptions} onSelect={setSelectedFicha} placeholder={t('reports.selectFicha')} containerStyle={s.field} />
        <DateField label={t('reports.filters.dateFrom')} value={dateFrom} onChange={setDateFrom} placeholder="YYYY-MM-DD" containerStyle={s.field} />
        <DateField label={t('reports.filters.dateTo')} value={dateTo} onChange={setDateTo} minDate={dateFrom || undefined} error={dateError} placeholder="YYYY-MM-DD" containerStyle={s.field} />
      </View><View style={s.actions}><AppButton title={t('reports.actions.filter')} onPress={applyDates} fullWidth={false} style={s.button} /><AppButton title={t('reports.actions.clear')} onPress={clearFilters} variant="outline" fullWidth={false} style={s.button} /></View></View>
      {stats && <><View style={[s.box, { backgroundColor: card, borderColor: border }]}><Text style={[s.sectionTitle, { color: text }]}>{t('reports.summary.title')}</Text><View style={s.stats}>{totals.map(item => <View key={item.label} style={s.stat}><Text style={[s.statLabel, { color: muted }]}>{item.label}</Text><Text style={[s.statValue, { color: item.color }]}>{item.value}</Text></View>)}</View></View>
      <View style={[s.box, { backgroundColor: card, borderColor: border }]}><Text style={[s.sectionTitle, { color: text }]}>{t('reports.summaryVisual')}</Text>{chart.map(item => <View key={item.label} style={s.chartRow}><Text style={[s.chartLabel, { color: muted }]}>{item.label}</Text><View style={[s.chartTrack, { backgroundColor: isDark ? Colors.dark.inputBg : Colors.light.inputBg }]}><View style={[s.chartBar, { backgroundColor: item.color, width: `${(item.value / maxChartValue) * 100}%` }]} /></View><Text style={[s.chartValue, { color: text }]}>{item.value}</Text></View>)}</View>
      <View style={[s.box, { backgroundColor: card, borderColor: border }]}><View style={s.actions}><AppButton title={t('reports.export.pdf')} onPress={() => handleExport('pdf')} disabled={!stats.learners.length || !dateIsValid} fullWidth={false} style={s.button} /><AppButton title={t('reports.export.excel')} onPress={() => handleExport('excel')} disabled={!stats.learners.length || !dateIsValid} variant="outline" fullWidth={false} style={s.button} /></View></View>
      <Text style={[s.sectionTitle, { color: text }]}>{t('academic.learners')}</Text>{stats.learners.length > 0 && records.length === 0 && <Text style={[s.notice, { color: muted }]}>{t('reports.noAttendanceRecords')}</Text>}</>}
    </>}
    renderItem={({ item }) => <View style={[s.box, { backgroundColor: card, borderColor: border }]}><View style={s.cardHead}><Text style={[s.name, { color: text }]}>{item.name}</Text><Text style={[s.document, { color: muted }]}>{item.document}</Text></View><View style={s.metrics}><Text style={{ color: Colors.success }}>{t('reports.table.attendances')}: {item.attendances}</Text><Text style={{ color: Colors.warning }}>{t('reports.table.lateCount')}: {item.lateCount}</Text><Text style={{ color: Colors.error }}>{t('reports.table.absences')}: {item.absences}</Text><Text style={{ color: theme.primary }}>{t('reports.table.percentage')}: {item.percentage}%</Text></View></View>}
    ListEmptyComponent={selected ? <View style={s.empty}><Ionicons name={selected.learners.length ? 'document-text-outline' : 'people-outline'} size={40} color={muted} /><Text style={[s.emptyText, { color: muted }]}>{selected.learners.length ? t('reports.noAttendanceRecords') : t('reports.noDataFicha')}</Text></View> : <View style={s.empty}><Ionicons name="analytics-outline" size={40} color={muted} /><Text style={[s.emptyText, { color: muted }]}>{t('reports.selectFicha')}</Text></View>} /></View>;
}

const s = StyleSheet.create({ safe: { flex: 1 }, list: { padding: 16, gap: 10, paddingBottom: 32 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }, title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, flex: 1 }, box: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 2 }, fields: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, field: { flexBasis: 220, flexGrow: 1, minWidth: 180 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }, button: { flexGrow: 1, minWidth: 160 }, sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.black, marginBottom: 10 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, stat: { flexBasis: 110, flexGrow: 1 }, statLabel: { fontSize: FontSize.sm }, statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black }, chartRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 }, chartLabel: { width: 92, fontSize: FontSize.sm }, chartTrack: { flex: 1, height: 9, borderRadius: 5, overflow: 'hidden' }, chartBar: { height: '100%', borderRadius: 5, minWidth: 2 }, chartValue: { width: 28, textAlign: 'right', fontSize: FontSize.sm, fontWeight: FontWeight.bold }, cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, name: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold }, document: { fontSize: FontSize.sm }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 }, notice: { marginBottom: 2, fontSize: FontSize.sm }, empty: { alignItems: 'center', paddingVertical: 56 }, emptyText: { marginTop: 10, textAlign: 'center', fontSize: FontSize.base } });
