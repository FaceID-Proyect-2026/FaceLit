import { refreshAcademicStoreFromBackend, useAcademic } from '@/features/academic/useAcademic';
import type { DayCell } from '@/features/attendance/useAttendanceRF6';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { fetchAttendanceMatrix } from '@/shared/services/facialAttendanceService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterPeriod = 'all' | 'lastMonth' | 'lastQuarter' | 'lastYear';

const todayBogota = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

function periodStart(period: FilterPeriod, today: string) {
  if (period === 'all') return '2020-01-01';
  const date = new Date(`${today}T12:00:00Z`);
  if (period === 'lastMonth') date.setUTCMonth(date.getUTCMonth() - 1);
  if (period === 'lastQuarter') date.setUTCMonth(date.getUTCMonth() - 3);
  if (period === 'lastYear') date.setUTCFullYear(date.getUTCFullYear() - 1);
  return date.toISOString().slice(0, 10);
}

function fmtDateLong(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(`${date}T12:00:00Z`));
}

export default function ApprenticeAttendanceScreen() {
  const { user, role } = useAuth();
  const { allFichas } = useAcademic();
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();

  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [cells, setCells] = useState<DayCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  useEffect(() => {
    refreshAcademicStoreFromBackend(role).catch(() => undefined);
  }, [role]);

  const currentFicha = useMemo(() => {
    if (!user) return null;
    return allFichas.find((ficha) =>
      ficha.learners.some((learner) =>
        learner.status === 'active' &&
        (learner.id === user.id || learner.document === user.document),
      ),
    ) ?? null;
  }, [allFichas, user]);

  const currentLearner = useMemo(() => {
    if (!currentFicha || !user) return null;
    return currentFicha.learners.find((learner) =>
      learner.status === 'active' &&
      (learner.id === user.id || learner.document === user.document),
    ) ?? null;
  }, [currentFicha, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      if (!currentFicha || !currentLearner) {
        setCells([]);
        setError(null);
        return;
      }

      const today = todayBogota();
      setLoading(true);
      setError(null);
      try {
        const matrix = await fetchAttendanceMatrix({
          idChip: currentFicha.id,
          dateFrom: periodStart(period, today),
          dateTo: today,
        });
        if (cancelled) return;

        const learner = matrix.learners.find((item) =>
          item.learnerId === currentLearner.id ||
          item.learnerDocument === currentLearner.document,
        );

        setCells((learner?.days ?? [])
          .map((day) => ({
            idFacialEvent: day.idFacialEvent ?? null,
            idRecordEnvironment: day.idRecordEnvironment,
            apprenticeId: learner?.apprenticeId,
            date: day.date,
            status: day.status,
            entryTime: day.entryTime,
            delayMinutes: day.delayMinutes,
            environmentName: day.environmentName,
            instructorName: day.instructorName,
            fichaNumber: day.fichaNumber,
            programName: day.programName,
            exitRegistered: day.exitRegistered,
            excuse: day.excuse ?? null,
          }))
          .sort((a, b) => b.date.localeCompare(a.date)));
      } catch (err: any) {
        if (cancelled) return;
        setCells([]);
        setError(err?.response?.data?.message ?? 'No fue posible cargar tu asistencia.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [currentFicha, currentLearner, period]);

  const stats = useMemo(() => ({
    punctual: cells.filter((cell) => cell.status === 'punctual').length,
    late: cells.filter((cell) => cell.status === 'late').length,
    absent: cells.filter((cell) => cell.status === 'absent').length,
    rate: cells.length
      ? Math.round((cells.filter((cell) => cell.status === 'punctual' || cell.status === 'late').length / cells.length) * 100)
      : 0,
  }), [cells]);

  const statusColor = (cell: DayCell) => {
    if (cell.status === 'punctual') return Colors.success;
    if (cell.status === 'late') return Colors.warning;
    if (cell.status === 'absent') return Colors.error;
    return muted;
  };

  const renderStatusBox = (cell: DayCell) => {
    if (cell.status === 'absent' && cell.excuse === true) {
      return <Text style={[s.statusMark, { color: Colors.error }]}>E</Text>;
    }
    if (cell.status === 'absent') {
      return <Ionicons name="close-circle" size={16} color={Colors.error} />;
    }
    if (cell.status === 'late') {
      return <Ionicons name="time" size={16} color={Colors.warning} />;
    }
    if (cell.status === 'punctual') {
      return <View style={[s.statusDot, { backgroundColor: Colors.success }]} />;
    }
    return <Text style={[s.emptyMark, { color: muted }]}>-</Text>;
  };

  return (
    <View style={[s.safe, { backgroundColor: bg }]}>
      <View style={[s.header, { borderBottomColor: border }]}>
        <Text style={[s.headerTitle, { color: text }]}>{t('sidebar.myAttendance')}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.statsCard, { backgroundColor: cardBg, borderColor: border }]}>
          {[
            { icon: 'checkmark-circle', color: Colors.success, value: stats.punctual, label: t('apprentice.attendance.punctual') },
            { icon: 'time', color: Colors.warning, value: stats.late, label: t('apprentice.attendance.late') },
            { icon: 'close-circle', color: Colors.error, value: stats.absent, label: t('apprentice.attendance.absent') },
            { icon: 'bar-chart-outline', color: theme.primary, value: `${stats.rate}%`, label: t('dashboard.attendanceRate') },
          ].map((item) => (
            <View key={item.label} style={s.statItem}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={[s.statValue, { color: text }]}>{item.value}</Text>
              <Text style={[s.statLabel, { color: muted }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
          {(['all', 'lastMonth', 'lastQuarter', 'lastYear'] as FilterPeriod[]).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setPeriod(item)}
              style={[
                s.filterChip,
                {
                  backgroundColor: period === item ? theme.primary + '20' : 'transparent',
                  borderColor: period === item ? theme.primary : border,
                },
              ]}
            >
              <Text style={[s.filterText, { color: period === item ? theme.primary : muted }]}>
                {item === 'all' ? t('apprentice.attendance.allPeriods') : t(`apprentice.attendance.${item}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && (
          <View style={s.emptyBox}>
            <Ionicons name="sync-outline" size={28} color={muted} />
            <Text style={[s.emptyText, { color: muted }]}>{t('common.loading')}</Text>
          </View>
        )}

        {!loading && error && (
          <View style={s.emptyBox}>
            <Ionicons name="alert-circle-outline" size={28} color={Colors.error} />
            <Text style={[s.emptyText, { color: Colors.error }]}>{error}</Text>
          </View>
        )}

        {!loading && !error && !currentFicha && (
          <View style={s.emptyBox}>
            <Ionicons name="school-outline" size={28} color={muted} />
            <Text style={[s.emptyText, { color: muted }]}>No tienes una ficha activa asociada.</Text>
          </View>
        )}

        {!loading && !error && currentFicha && cells.length === 0 && (
          <View style={s.emptyBox}>
            <Ionicons name="calendar-outline" size={28} color={muted} />
            <Text style={[s.emptyText, { color: muted }]}>{t('apprentice.attendance.noRecordsPeriod')}</Text>
          </View>
        )}

        {!loading && !error && cells.length > 0 && (
          <View style={[s.table, { borderColor: border, backgroundColor: cardBg }]}>
            <View style={[s.headerRow, { backgroundColor: theme.primary + '20', borderColor: border }]}>
              <View style={[s.dateCell, { borderColor: border }]}>
                <Text style={[s.thText, { color: theme.primary }]}>{t('attendance.fields.date')}</Text>
              </View>
              <View style={[s.instructorCell, { borderColor: border }]}>
                <Text style={[s.thText, { color: theme.primary }]}>{t('attendance.fields.instructor')}</Text>
              </View>
              <View style={[s.statusCell, { borderColor: border }]}>
                <Text style={[s.thText, { color: theme.primary }]}>{t('attendance.fields.status')}</Text>
              </View>
            </View>

            {cells.map((cell, index) => (
              <View
                key={`${cell.idRecordEnvironment}-${cell.date}`}
                style={[
                  s.dataRow,
                  {
                    backgroundColor: index % 2 === 0 ? cardBg : theme.primary + '08',
                    borderColor: border,
                  },
                ]}
              >
                <View style={[s.dateCell, { borderColor: border }]}>
                  <Text style={[s.dateText, { color: text }]}>{fmtDateLong(cell.date, i18n.language)}</Text>
                </View>
                <View style={[s.instructorCell, { borderColor: border }]}>
                  <Text style={[s.instructorText, { color: text }]} numberOfLines={2}>
                    {cell.instructorName || '-'}
                  </Text>
                </View>
                <View style={[s.statusCell, { borderColor: border }]}>
                  <View
                    style={[
                      s.statusBox,
                      {
                        backgroundColor: statusColor(cell) + '30',
                        borderColor: statusColor(cell) + '80',
                      },
                    ]}
                  >
                    {renderStatusBox(cell)}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={s.legend}>
          {[
            { label: t('attendance.statuses.punctual'), node: <View style={[s.legendDot, { backgroundColor: Colors.success }]} /> },
            { label: t('attendance.statuses.late'), node: <Ionicons name="time" size={14} color={Colors.warning} /> },
            { label: t('attendance.statuses.absent'), node: <Ionicons name="close-circle" size={14} color={Colors.error} /> },
            { label: 'Excusa', node: <Text style={[s.legendMark, { color: Colors.error }]}>E</Text> },
          ].map((item) => (
            <View key={item.label} style={s.legendItem}>
              {item.node}
              <Text style={[s.legendText, { color: muted }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  statsCard: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statLabel: { fontSize: FontSize.xs, textAlign: 'center' },
  filterScroll: { gap: 8 },
  filterChip: { borderRadius: 20, borderWidth: 1.2, paddingHorizontal: 14, paddingVertical: 7 },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: FontSize.sm, textAlign: 'center' },
  table: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', borderBottomWidth: 1 },
  dataRow: { flexDirection: 'row', borderBottomWidth: 1 },
  dateCell: { flex: 1.15, minHeight: 54, borderRightWidth: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  instructorCell: { flex: 1, minHeight: 54, borderRightWidth: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  statusCell: { width: 88, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10 },
  thText: { fontSize: FontSize.xs, fontWeight: FontWeight.black, textAlign: 'center' },
  dateText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  instructorText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textAlign: 'center' },
  statusBox: { width: 42, height: 34, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statusMark: { fontSize: FontSize.sm, fontWeight: FontWeight.black },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  emptyMark: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendMark: { fontSize: FontSize.sm, fontWeight: FontWeight.black },
  legendText: { fontSize: FontSize.xs },
});
