import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useAttendance } from '@/features/attendance/useAttendance';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppButton from '@/shared/components/ui/AppButton';

interface MonthlyStat {
  month: string;
  attendances: number;
  absences: number;
  lateCount: number;
  totalClasses: number;
  percentage: number;
}

export default function MyPerformanceScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const attendance = useAttendance();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const userAttendance = useMemo(() => {
    if (!user) return [];
    return attendance.filter(r => r.userId === user.id).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendance, user?.id]);

  const overallStats = useMemo(() => {
    const total = userAttendance.length;
    // Un retraso sigue siendo una asistencia; el estado ya viene resuelto por RF-6.
    const attendances = userAttendance.filter(r => r.status === 'punctual' || r.status === 'late').length;
    const lateCount = userAttendance.filter(r => r.status === 'late').length;
    const absences = userAttendance.filter(r => r.status === 'absent').length;
    const avgDelay = userAttendance.filter(r => r.status === 'late').reduce((sum, r) => sum + r.delayMinutes, 0) / Math.max(lateCount, 1);
    const percentage = total > 0 ? Math.round((attendances / total) * 100) : 0;
    
    const daysNoAttendance = new Set(userAttendance.filter(r => r.status === 'absent').map(r => r.date)).size;

    return { total, attendances, lateCount, absences, avgDelay: Math.round(avgDelay), percentage, daysNoAttendance, totalClasses: total };
  }, [userAttendance]);

  const monthlyStats = useMemo((): MonthlyStat[] => {
    const monthsMap = new Map<string, MonthlyStat>();
    userAttendance.forEach(r => {
      const monthKey = r.date.substring(0, 7);
      const existing = monthsMap.get(monthKey) || { month: monthKey, attendances: 0, absences: 0, lateCount: 0, totalClasses: 0, percentage: 0 };
      existing.totalClasses++;
      if (r.status === 'punctual' || r.status === 'late') existing.attendances++;
      if (r.status === 'late') existing.lateCount++;
      else if (r.status === 'absent') existing.absences++;
      existing.percentage = existing.totalClasses > 0 ? Math.round((existing.attendances / existing.totalClasses) * 100) : 0;
      monthsMap.set(monthKey, existing);
    });
    return Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [userAttendance]);

  const maxMonthlyPercentage = useMemo(() => Math.max(...monthlyStats.map(m => m.percentage), 1), [monthlyStats]);
  const maxMonthlyTotal = useMemo(() => Math.max(...monthlyStats.map(m => m.totalClasses), 1), [monthlyStats]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(i18n.language, { month: 'short', year: '2-digit' });
  };

  return (
    <View style={[mps.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={mps.backBtn}>
        <Ionicons name="arrow-back" size={20} color={text} />
        <Text style={[mps.backText, { color: text }]}>{t('common.back')}</Text>
      </TouchableOpacity>
      
      <Text style={[mps.title, { color: text, paddingHorizontal: 16, marginTop: 8 }]}>{t('reports.myPerformance')}</Text>

      {user && (
        <View style={[mps.userCard, { backgroundColor: cardBg, borderColor: border, marginHorizontal: 16, marginBottom: 16 }]}>
          <View style={mps.userHeader}>
            <View style={[mps.avatar, { backgroundColor: theme.primary }]}>
              <Text style={mps.avatarText}>{user.name.charAt(0)}{user.lastname.charAt(0)}</Text>
            </View>
            <View style={mps.userInfo}>
              <Text style={[mps.userName, { color: text }]}>{user.name} {user.lastname}</Text>
              <Text style={[mps.userRole, { color: muted }]}>{t('reports.performance.title')}</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View style={[mps.statsGrid, { gap: 12 }]}>
          {[
            { label: t('reports.performance.attendanceRate'), value: `${overallStats.percentage}%`, color: theme.primary, icon: 'pie-chart-outline', bg: theme.primary + '20' },
            { label: t('reports.performance.totalAttendances'), value: overallStats.attendances.toString(), color: Colors.success, icon: 'checkmark-circle-outline', bg: Colors.success + '20' },
            { label: t('reports.performance.totalAbsences'), value: overallStats.absences.toString(), color: Colors.error, icon: 'close-circle-outline', bg: Colors.error + '20' },
            { label: t('reports.performance.totalLate'), value: overallStats.lateCount.toString(), color: Colors.warning, icon: 'time-outline', bg: Colors.warning + '20' },
            { label: t('reports.performance.avgDelay'), value: `${overallStats.avgDelay} min`, color: theme.primary, icon: 'timer-outline', bg: theme.primary + '20' },
            { label: t('reports.performance.daysNoAttendance'), value: overallStats.daysNoAttendance.toString(), color: Colors.error, icon: 'calendar-clear-outline', bg: Colors.error + '20' },
            { label: t('reports.performance.totalClasses'), value: overallStats.totalClasses.toString(), color: text, icon: 'document-text-outline', bg: muted + '20' },
          ].map((s, i) => (
            <TouchableOpacity key={i} style={[mps.statCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={[mps.statIcon, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon as any} size={24} color={s.color} />
              </View>
              <View style={mps.statContent}>
                <Text style={[mps.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[mps.statLabel, { color: muted }]}>{s.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {monthlyStats.length > 0 && (
          <View style={[mps.chartCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[mps.chartTitle, { color: text }]}>{t('reports.performance.monthlyChart')}</Text>
            <View style={mps.chartContainer}>
              {monthlyStats.map((month, i) => (
                <View key={month.month} style={mps.monthColumn}>
                  <View style={mps.barsContainer}>
                    <View style={[
                      mps.bar,
                      {
                        height: `${(month.attendances / maxMonthlyTotal) * 100}%`,
                        backgroundColor: Colors.success,
                        minHeight: month.attendances > 0 ? 4 : 0,
                      }
                    ]} />
                    <View style={[
                      mps.bar,
                      {
                        height: `${(month.lateCount / maxMonthlyTotal) * 100}%`,
                        backgroundColor: Colors.warning,
                        minHeight: month.lateCount > 0 ? 4 : 0,
                      }
                    ]} />
                    <View style={[
                      mps.bar,
                      {
                        height: `${(month.absences / maxMonthlyTotal) * 100}%`,
                        backgroundColor: Colors.error,
                        minHeight: month.absences > 0 ? 4 : 0,
                      }
                    ]} />
                  </View>
                  <Text style={[mps.monthLabel, { color: muted }]}>{formatMonth(month.month)}</Text>
                  <Text style={[mps.monthPercentage, { color: theme.primary }]}>{month.percentage}%</Text>
                </View>
              ))}
            </View>
            <View style={mps.chartLegend}>
              {[
                { color: Colors.success, label: t('reports.statuses.punctual') },
                { color: Colors.warning, label: t('reports.statuses.late') },
                { color: Colors.error, label: t('reports.statuses.absent') },
              ].map((l, i) => (
                <View key={i} style={mps.legendItem}>
                  <View style={[mps.legendDot, { backgroundColor: l.color }]} />
                  <Text style={[mps.legendText, { color: muted }]}>{l.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {monthlyStats.length === 0 && (
          <View style={[mps.emptyState, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="analytics-outline" size={64} color={muted} />
            <Text style={[mps.emptyTitle, { color: text, marginTop: 12 }]}>{t('reports.performance.noData')}</Text>
            <Text style={[mps.emptyText, { color: muted, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }]}>
              {t('reports.performance.noDataDesc')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const mps = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 12 },
  backText: { fontWeight: '700' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12 },
  userCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.black },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  userRole: { fontSize: FontSize.md, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { flex: 1, minWidth: '48%', borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  statLabel: { fontSize: FontSize.xs },
  chartCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  chartTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 16 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 180, paddingVertical: 8 },
  monthColumn: { alignItems: 'center', flex: 1 },
  barsContainer: { flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: 120, gap: 1 },
  bar: { width: '100%', borderRadius: 2, minWidth: 20 },
  monthLabel: { fontSize: FontSize.xs, marginTop: 8, textAlign: 'center' },
  monthPercentage: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: 2 },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: FontSize.sm },
  emptyState: { borderRadius: 12, borderWidth: 1, padding: 40, alignItems: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  emptyText: { fontSize: FontSize.base },
});
