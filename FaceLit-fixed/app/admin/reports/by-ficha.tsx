import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAttendance } from '@/features/attendance/useAttendance';
import { getFichasSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import { getSchedulesSnapshot, subscribe as subscribeSchedules } from '@/features/schedules/schedulesStore';
import { useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ScrollView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppButton from '@/shared/components/ui/AppButton';
import SelectField from '@/shared/components/ui/SelectField';
import DateField from '@/shared/components/ui/DateField';
import { exportReport, generateReportData, ExportOptions } from '@/shared/utils/export';

interface LearnerStats {
  id: string;
  name: string;
  document: string;
  totalClasses: number;
  attendances: number;
  absences: number;
  lateCount: number;
  percentage: number;
}

interface FichaStats {
  fichaNumber: string;
  fichaId: string;
  learners: LearnerStats[];
  totalClasses: number;
  attendances: number;
  absences: number;
  lateCount: number;
  percentage: number;
}

export default function ReportByFichaScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const attendance = useAttendance();
  
  useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  useSyncExternalStore(subscribeSchedules, getSchedulesSnapshot);

  const fichas = getFichasSnapshot();
  const schedules = getSchedulesSnapshot();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [selectedFicha, setSelectedFicha] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);

  const fichaOptions = useMemo(() => {
    const fichaMap = new Map<string, { id: string; number: string; learners: any[] }>();
    attendance.forEach(a => {
      if (!fichaMap.has(a.fichaNumber)) {
        const ficha = fichas.find(f => f.number === a.fichaNumber);
        fichaMap.set(a.fichaNumber, {
          id: ficha?.id || '',
          number: a.fichaNumber,
          learners: ficha?.learners || [],
        });
      }
    });
    return Array.from(fichaMap.entries()).map(([number, data]) => ({
      value: number,
      label: `Ficha ${number}`,
      learners: data.learners,
      fichaId: data.id,
    }));
  }, [attendance, fichas]);

  const selectedFichaData = fichaOptions.find(f => f.value === selectedFicha);

  const learnerOptions = useMemo(() => {
    if (!selectedFichaData) return [];
    return selectedFichaData.learners.map(l => ({
      value: l.id,
      label: `${l.name} ${l.lastname} (${l.document})`,
    }));
  }, [selectedFichaData]);

  const filteredAttendance = useMemo(() => {
    if (!selectedFicha) return [];
    return attendance.filter(r => {
      if (r.fichaNumber !== selectedFicha) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      if (selectedLearner && r.userId !== selectedLearner) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendance, selectedFicha, dateFrom, dateTo, selectedLearner]);

  const fichaStats = useMemo((): FichaStats | null => {
    if (!selectedFichaData) return null;
    
    const fichaAttendance = attendance.filter(r => r.fichaNumber === selectedFichaData.value);
    const dateFiltered = fichaAttendance.filter(r => {
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });

    const schedulesForFicha = schedules.filter(s => s.fichaNumber === selectedFichaData.value);
    const uniqueDates = new Set(dateFiltered.map(r => r.date)).size;
    const totalExpected = schedulesForFicha.length * Math.max(uniqueDates, 1);

    const learners = selectedFichaData.learners.filter(l => l.status === 'active');
    const stats = learners.map(learner => {
      const learnerRecords = dateFiltered.filter(r => r.userId === learner.id);
      const attendances = learnerRecords.filter(r => r.status === 'punctual').length;
      const lateCount = learnerRecords.filter(r => r.status === 'late').length;
      const absences = learnerRecords.filter(r => r.status === 'absent').length;
      const totalClasses = attendances + lateCount + absences;
      const percentage = totalClasses > 0 ? Math.round((attendances / totalClasses) * 100) : 0;
      
      return {
        id: learner.id,
        name: `${learner.name} ${learner.lastname}`,
        document: learner.document,
        totalClasses,
        attendances,
        absences,
        lateCount,
        percentage,
      };
    });

    const totalAttendances = stats.reduce((sum, s) => sum + s.attendances, 0);
    const totalAbsences = stats.reduce((sum, s) => sum + s.absences, 0);
    const totalLate = stats.reduce((sum, s) => sum + s.lateCount, 0);
    const totalClassesAll = stats.reduce((sum, s) => sum + s.totalClasses, 0);
    const avgPercentage = stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.percentage, 0) / stats.length) : 0;

    return {
      fichaNumber: selectedFichaData.value,
      fichaId: selectedFichaData.fichaId,
      learners: stats,
      totalClasses: totalClassesAll,
      attendances: totalAttendances,
      absences: totalAbsences,
      lateCount: totalLate,
      percentage: avgPercentage,
    };
  }, [attendance, schedules, selectedFichaData, dateFrom, dateTo]);

  const clearFilters = () => {
    setSelectedFicha('');
    setDateFrom('');
    setDateTo('');
    setSelectedLearner(null);
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!fichaStats) return;
    
    const filters = {
      ficha: selectedFicha,
      dateFrom,
      dateTo,
    };
    
    const exportData = generateReportData('by-ficha', fichaStats, filters, t);
    const options: ExportOptions = {
      filename: `reporte-ficha-${selectedFicha}-${new Date().toISOString().split('T')[0]}`,
      format,
    };
    
    await exportReport(exportData, options);
  };

  const hasActiveFilters = selectedFicha || dateFrom || dateTo || selectedLearner;

  if (!selectedFicha) {
    return (
      <View style={[rbfs.safe, { backgroundColor: bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={rbfs.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[rbfs.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[rbfs.title, { color: text, paddingHorizontal: 16, marginTop: 8 }]}>{t('reports.byFicha')}</Text>
        
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12, flexWrap: 'wrap' }}>
          <TouchableOpacity onPress={() => setSelectedFicha('')} style={[rbfs.chip, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{t('reports.filters.all')}</Text>
          </TouchableOpacity>
          {fichaOptions.map(f => (
            <TouchableOpacity key={f.value} onPress={() => setSelectedFicha(f.value)} style={rbfs.chip}>
              <Text style={{ color: muted, fontWeight: '700', fontSize: 13 }}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Ionicons name="analytics-outline" size={64} color={muted} />
          <Text style={{ color: muted, marginTop: 16, fontSize: FontSize.lg, textAlign: 'center', paddingHorizontal: 32 }}>
            {t('reports.byFicha')} - {t('reports.noDataFicha')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[rbfs.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={rbfs.backBtn}>
        <Ionicons name="arrow-back" size={20} color={text} />
        <Text style={[rbfs.backText, { color: text }]}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <Text style={[rbfs.title, { color: text, paddingHorizontal: 16, marginTop: 8 }]}>{t('reports.byFicha')}: Ficha {selectedFicha}</Text>

      <View style={[rbfs.filtersToggle, { backgroundColor: cardBg, borderColor: border, marginHorizontal: 16 }]}>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={rbfs.toggleBtn}>
          <Text style={[rbfs.toggleText, { color: text }]}>
            {t('reports.actions.filter')} {' ▼'}
          </Text>
          <Ionicons name={showFilters ? 'remove' : 'add'} size={20} color={muted} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView style={rbfs.filtersScroll} contentContainerStyle={rbfs.filtersContent} showsHorizontalScrollIndicator={false}>
          <View style={rbfs.filterRow}>
            <SelectField
              label={t('reports.filters.ficha')}
              value={selectedFicha}
              options={[{ value: '', label: t('reports.filters.all') }, ...fichaOptions.map(f => ({ value: f.value, label: f.label }))]}
              onSelect={v => { setSelectedFicha(v); setSelectedLearner(null); }}
              placeholder={t('reports.filters.all')}
              containerStyle={rbfs.filterField}
            />
            <SelectField
              label={t('reports.filters.user')}
              value={selectedLearner || ''}
              options={[{ value: '', label: t('reports.filters.all') }, ...learnerOptions]}
              onSelect={setSelectedLearner}
              placeholder={t('reports.filters.all')}
              containerStyle={rbfs.filterField}
            />
            <DateField
              label={t('reports.filters.dateFrom')}
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="AAAA-MM-DD"
              containerStyle={rbfs.filterField}
            />
            <DateField
              label={t('reports.filters.dateTo')}
              value={dateTo}
              onChange={setDateTo}
              placeholder="AAAA-MM-DD"
              containerStyle={rbfs.filterField}
            />
          </View>
          {hasActiveFilters && (
            <AppButton
              title={t('reports.actions.clear')}
              onPress={clearFilters}
              variant="outline"
              style={rbfs.clearBtn}
            />
          )}
        </ScrollView>
      )}

      {fichaStats && (
        <View style={[rbfs.summaryCard, { backgroundColor: cardBg, borderColor: border, marginHorizontal: 16, marginBottom: 12 }]}>
          <Text style={[rbfs.summaryTitle, { color: text }]}>{t('reports.summary.title')}</Text>
          <View style={rbfs.statsGrid}>
            {[
              { label: t('reports.summary.totalRecords'), value: fichaStats.totalClasses, color: theme.primary },
              { label: t('reports.summary.present'), value: fichaStats.attendances, color: Colors.success },
              { label: t('reports.summary.lateCount'), value: fichaStats.lateCount, color: Colors.warning },
              { label: t('reports.summary.absentCount'), value: fichaStats.absences, color: Colors.error },
              { label: t('reports.summary.rate'), value: `${fichaStats.percentage}%`, color: theme.primary },
            ].map((s, i) => (
              <View key={i} style={rbfs.statItem}>
                <Text style={[rbfs.statLabel, { color: muted }]}>{s.label}</Text>
                <Text style={[rbfs.statValue, { color: s.color }]}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={rbfs.exportRow}>
        <AppButton
          title={t('reports.export.pdf')}
          onPress={() => handleExport('pdf')}
          variant="primary"
          style={rbfs.exportBtn}
          disabled={!fichaStats || fichaStats.learners.length === 0}
        />
        <AppButton
          title={t('reports.export.excel')}
          onPress={() => handleExport('excel')}
          variant="outline"
          style={rbfs.exportBtn}
          disabled={!fichaStats || fichaStats.learners.length === 0}
        />
        <AppButton
          title={t('reports.export.excel').replace('Excel', 'CSV')}
          onPress={() => handleExport('csv')}
          variant="ghost"
          style={rbfs.exportBtn}
          disabled={!fichaStats || fichaStats.learners.length === 0}
        />
      </View>

      {fichaStats && fichaStats.learners.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <Ionicons name="people-outline" size={48} color={muted} />
          <Text style={{ color: muted, marginTop: 12, fontSize: FontSize.base }}>{t('reports.noDataFicha')}</Text>
        </View>
      )}

      {fichaStats && fichaStats.learners.length > 0 && (
        <FlatList
          data={fichaStats.learners}
          keyExtractor={l => l.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <View style={[rbfs.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[rbfs.cardTitle, { color: text }]}>{item.name}</Text>
                <Text style={{ color: muted, fontSize: 12 }}>{item.document}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                <View style={rbfs.statMini}>
                  <Text style={[rbfs.statMiniLabel, { color: muted }]}>{t('reports.table.totalClasses')}</Text>
                  <Text style={[rbfs.statMiniValue, { color: text }]}>{item.totalClasses}</Text>
                </View>
                <View style={rbfs.statMini}>
                  <Text style={[rbfs.statMiniLabel, { color: Colors.success }]}>{t('reports.table.attendances')}</Text>
                  <Text style={[rbfs.statMiniValue, { color: Colors.success }]}>{item.attendances}</Text>
                </View>
                <View style={rbfs.statMini}>
                  <Text style={[rbfs.statMiniLabel, { color: Colors.error }]}>{t('reports.table.absences')}</Text>
                  <Text style={[rbfs.statMiniValue, { color: Colors.error }]}>{item.absences}</Text>
                </View>
                <View style={rbfs.statMini}>
                  <Text style={[rbfs.statMiniLabel, { color: Colors.warning }]}>{t('reports.table.lateCount')}</Text>
                  <Text style={[rbfs.statMiniValue, { color: Colors.warning }]}>{item.lateCount}</Text>
                </View>
                <View style={rbfs.statMini}>
                  <Text style={[rbfs.statMiniLabel, { color: theme.primary }]}>{t('reports.table.percentage')}</Text>
                  <Text style={[rbfs.statMiniValue, { color: theme.primary, fontWeight: '700' }]}>{item.percentage}%</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const rbfs = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 12 },
  backText: { fontWeight: '700' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12 },
  chip: { borderRadius: 20, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 6 },
  filtersToggle: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  filtersScroll: { marginHorizontal: 16, marginBottom: 12 },
  filtersContent: { paddingVertical: 8 },
  filterRow: { gap: 12 },
  filterField: { width: Platform.OS === 'web' ? 280 : '100%', minWidth: 200 },
  clearBtn: { marginTop: 8, alignSelf: 'flex-start' },
  summaryCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  summaryTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statItem: { flex: 1, minWidth: 100 },
  statLabel: { fontSize: FontSize.sm, marginBottom: 2 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  exportRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  exportBtn: { flex: 1 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statMini: { flex: 1, minWidth: 80 },
  statMiniLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  statMiniValue: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
});
