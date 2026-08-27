import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAttendance } from '@/features/attendance/useAttendance';
import { getFichasSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import { getSnapshot as getEnvironmentsSnapshot, subscribe as subscribeEnvironments } from '@/features/environments/environmentsStore';
import { getProgramsSnapshot } from '@/features/academic/academicStore';
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

interface FilterOptions {
  users: { value: string; label: string }[];
  fichas: { value: string; label: string }[];
  environments: { value: string; label: string }[];
  programs: { value: string; label: string }[];
  statuses: { value: string; label: string }[];
}

export default function ReportByUserScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const attendance = useAttendance();
  
  useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  useSyncExternalStore(subscribeEnvironments, getEnvironmentsSnapshot);
  useSyncExternalStore(subscribeSchedules, getSchedulesSnapshot);

  const fichas = getFichasSnapshot();
  const programs = getProgramsSnapshot();
  const environments = getEnvironmentsSnapshot();
  const schedules = getSchedulesSnapshot();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const inputBg = isDark ? Colors.dark.inputBg : Colors.light.inputBg;
  const inputBorder = isDark ? Colors.dark.inputBorder : Colors.light.inputBorder;

  const [selectedUser, setSelectedUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFicha, setSelectedFicha] = useState('');
  const [selectedEnvironment, setSelectedEnvironment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  const filterOptions = useMemo((): FilterOptions => {
    const userMap = new Map<string, { id: string; name: string; ficha: string }>();
    attendance.forEach(a => {
      if (!userMap.has(a.userId)) {
        userMap.set(a.userId, { id: a.userId, name: a.userName, ficha: a.fichaNumber });
      }
    });
    const users = Array.from(userMap.entries()).map(([id, u]) => ({ value: id, label: `${u.name} (${u.ficha})` }));

    const fichaMap = new Map<string, string>();
    attendance.forEach(a => fichaMap.set(a.fichaNumber, a.fichaNumber));
    const fichasList = Array.from(fichaMap.entries()).map(([k, v]) => ({ value: k, label: `Ficha ${v}` }));

    const envMap = new Map<string, string>();
    attendance.forEach(a => envMap.set(a.environmentName, a.environmentName));
    const environmentsList = Array.from(envMap.entries()).map(([k, v]) => ({ value: k, label: v }));

    const progMap = new Map<string, string>();
    attendance.forEach(a => progMap.set(a.programId, a.programName));
    const programsList = Array.from(progMap.entries()).map(([k, v]) => ({ value: k, label: v }));

    const statusOptions = [
      { value: 'punctual', label: t('reports.statuses.punctual') },
      { value: 'late', label: t('reports.statuses.late') },
      { value: 'absent', label: t('reports.statuses.absent') },
    ];

    return { users, fichas: fichasList, environments: environmentsList, programs: programsList, statuses: statusOptions };
  }, [attendance, t]);

  const filtered = useMemo(() => {
    return attendance.filter(record => {
      if (selectedUser && record.userId !== selectedUser) return false;
      if (dateFrom && record.date < dateFrom) return false;
      if (dateTo && record.date > dateTo) return false;
      if (selectedFicha && record.fichaNumber !== selectedFicha) return false;
      if (selectedEnvironment && record.environmentName !== selectedEnvironment) return false;
      if (selectedProgram && record.programId !== selectedProgram) return false;
      if (selectedStatus && record.status !== selectedStatus) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendance, selectedUser, dateFrom, dateTo, selectedFicha, selectedEnvironment, selectedProgram, selectedStatus]);

  const hasActiveFilters = selectedUser || dateFrom || dateTo || selectedFicha || selectedEnvironment || selectedProgram || selectedStatus;

  const clearFilters = () => {
    setSelectedUser('');
    setDateFrom('');
    setDateTo('');
    setSelectedFicha('');
    setSelectedEnvironment('');
    setSelectedProgram('');
    setSelectedStatus('');
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    const filters = {
      user: filterOptions.users.find(u => u.value === selectedUser)?.label || t('reports.filters.all'),
      ficha: filterOptions.fichas.find(f => f.value === selectedFicha)?.label || t('reports.filters.all'),
      environment: filterOptions.environments.find(e => e.value === selectedEnvironment)?.label || t('reports.filters.all'),
      program: filterOptions.programs.find(p => p.value === selectedProgram)?.label || t('reports.filters.all'),
      dateFrom,
      dateTo,
      status: filterOptions.statuses.find(s => s.value === selectedStatus)?.label || t('reports.filters.all'),
    };
    
    const exportData = generateReportData('by-user', filtered, filters, t);
    const options: ExportOptions = {
      filename: `reporte-usuario-${selectedUser || 'todos'}-${new Date().toISOString().split('T')[0]}`,
      format,
    };
    
    await exportReport(exportData, options);
  };

  const stats = useMemo(() => ({
    total: filtered.length,
    present: filtered.filter(r => r.status === 'punctual').length,
    late: filtered.filter(r => r.status === 'late').length,
    absent: filtered.filter(r => r.status === 'absent').length,
  }), [filtered]);

  return (
    <View style={[rbus.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={rbus.backBtn}>
        <Ionicons name="arrow-back" size={20} color={text} />
        <Text style={[rbus.backText, { color: text }]}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <Text style={[rbus.title, { color: text, paddingHorizontal: 16, marginTop: 8 }]}>{t('reports.byUser')}</Text>

      <View style={[rbus.filtersToggle, { backgroundColor: cardBg, borderColor: border, marginHorizontal: 16 }]}>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={rbus.toggleBtn}>
          <Text style={[rbus.toggleText, { color: text }]}>
            {t('reports.actions.filter')} {' ▼'}
          </Text>
          <Ionicons name={showFilters ? 'remove' : 'add'} size={20} color={muted} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView style={rbus.filtersScroll} contentContainerStyle={rbus.filtersContent} showsHorizontalScrollIndicator={false}>
          <View style={rbus.filterRow}>
            <SelectField
              label={t('reports.filters.user')}
              value={selectedUser}
              options={[{ value: '', label: t('reports.filters.all') }, ...filterOptions.users]}
              onSelect={setSelectedUser}
              placeholder={t('reports.filters.all')}
              containerStyle={rbus.filterField}
            />
            <SelectField
              label={t('reports.filters.ficha')}
              value={selectedFicha}
              options={[{ value: '', label: t('reports.filters.all') }, ...filterOptions.fichas]}
              onSelect={setSelectedFicha}
              placeholder={t('reports.filters.all')}
              containerStyle={rbus.filterField}
            />
            <SelectField
              label={t('reports.filters.environment')}
              value={selectedEnvironment}
              options={[{ value: '', label: t('reports.filters.all') }, ...filterOptions.environments]}
              onSelect={setSelectedEnvironment}
              placeholder={t('reports.filters.all')}
              containerStyle={rbus.filterField}
            />
            <SelectField
              label={t('reports.filters.program')}
              value={selectedProgram}
              options={[{ value: '', label: t('reports.filters.all') }, ...filterOptions.programs]}
              onSelect={setSelectedProgram}
              placeholder={t('reports.filters.all')}
              containerStyle={rbus.filterField}
            />
            <SelectField
              label={t('reports.filters.status')}
              value={selectedStatus}
              options={[{ value: '', label: t('reports.filters.all') }, ...filterOptions.statuses]}
              onSelect={setSelectedStatus}
              placeholder={t('reports.filters.all')}
              containerStyle={rbus.filterField}
            />
            <DateField
              label={t('reports.filters.dateFrom')}
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="AAAA-MM-DD"
              containerStyle={rbus.filterField}
            />
            <DateField
              label={t('reports.filters.dateTo')}
              value={dateTo}
              onChange={setDateTo}
              placeholder="AAAA-MM-DD"
              containerStyle={rbus.filterField}
            />
          </View>
          {hasActiveFilters && (
            <AppButton
              title={t('reports.actions.clear')}
              onPress={clearFilters}
              variant="outline"
              style={rbus.clearBtn}
            />
          )}
        </ScrollView>
      )}

      <View style={[rbus.summaryCard, { backgroundColor: cardBg, borderColor: border, marginHorizontal: 16, marginBottom: 12 }]}>
        <Text style={[rbus.summaryTitle, { color: text }]}>{t('reports.summary.title')}</Text>
        <View style={rbus.statsGrid}>
          {[
            { label: t('reports.summary.totalRecords'), value: stats.total, color: theme.primary },
            { label: t('reports.summary.present'), value: stats.present, color: Colors.success },
            { label: t('reports.summary.lateCount'), value: stats.late, color: Colors.warning },
            { label: t('reports.summary.absentCount'), value: stats.absent, color: Colors.error },
          ].map((s, i) => (
            <View key={i} style={rbus.statItem}>
              <Text style={[rbus.statLabel, { color: muted }]}>{s.label}</Text>
              <Text style={[rbus.statValue, { color: s.color }]}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={rbus.exportRow}>
        <AppButton
          title={t('reports.export.pdf')}
          onPress={() => handleExport('pdf')}
          variant="primary"
          style={rbus.exportBtn}
          disabled={filtered.length === 0}
        />
        <AppButton
          title={t('reports.export.excel')}
          onPress={() => handleExport('excel')}
          variant="outline"
          style={rbus.exportBtn}
          disabled={filtered.length === 0}
        />
        <AppButton
          title={t('reports.export.excel').replace('Excel', 'CSV')}
          onPress={() => handleExport('csv')}
          variant="ghost"
          style={rbus.exportBtn}
          disabled={filtered.length === 0}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => (
          <View style={[rbus.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[rbus.cardTitle, { color: text }]}>{item.userName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.status === 'punctual' ? Colors.success : item.status === 'late' ? Colors.warning : Colors.error }} />
                <Text style={{ color: item.status === 'punctual' ? Colors.success : item.status === 'late' ? Colors.warning : Colors.error, fontWeight: '700', fontSize: 12 }}>
                  {t(`attendance.statuses.${item.status}`)}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
              <Text style={{ color: muted, fontSize: 12 }}>{item.date}</Text>
              <Text style={{ color: muted, fontSize: 12 }}>{t('reports.table.entry')}: {item.entryTime || '--'}</Text>
              <Text style={{ color: muted, fontSize: 12 }}>{t('reports.table.exit')}: {item.exitTime || '--'}</Text>
              <Text style={{ color: muted, fontSize: 12 }}>{t('reports.table.env')}: {item.environmentName}</Text>
              <Text style={{ color: muted, fontSize: 12 }}>{t('reports.table.delay')}: {item.delayMinutes > 0 ? `${item.delayMinutes} min` : '--'}</Text>
              <Text style={{ color: muted, fontSize: 12 }}>{t('reports.table.ficha')}: {item.fichaNumber}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Ionicons name="document-text-outline" size={48} color={muted} />
            <Text style={{ color: muted, marginTop: 12, fontSize: FontSize.base }}>{t('reports.noData')}</Text>
          </View>
        }
      />
    </View>
  );
}

const rbus = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 12 },
  backText: { fontWeight: '700' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12 },
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
});