import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_ATTENDANCE } from '@/features/attendance/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function CalendarReportScreen() {
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const attendance = useAttendance();
  const { width } = useWindowDimensions();
  const isCompact = width < 560;
  
  useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  useSyncExternalStore(subscribeSchedules, getSchedulesSnapshot);

  const schedules = getSchedulesSnapshot();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [excuseDialogVisible, setExcuseDialogVisible] = useState(false);
  const [excuseMessage, setExcuseMessage] = useState('');
  const [excusePdf, setExcusePdf] = useState<string | null>(null);
  const [submittingExcuse, setSubmittingExcuse] = useState(false);
  const [excuses, setExcuses] = useState<Excuse[]>([]);
  const [selectedAbsenceRecord, setSelectedAbsenceRecord] = useState<DayRecord | null>(null);

  const userAttendance = useMemo(() => {
    if (!user) return [];
    return attendance.filter(r => r.userId === user.id);
  }, [attendance, user?.id]);

  const getDayStatus = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const records = userAttendance.filter(r => r.date === dateStr);
    if (records.length === 0) return 'none';
    if (records.some(r => r.status === 'absent')) return 'absent';
    if (records.some(r => r.status === 'late')) return 'late';
    return 'present';
  }, [userAttendance]);

  const getRecordsForDay = useCallback((date: Date): DayRecord[] => {
    const dateStr = date.toISOString().split('T')[0];
    return userAttendance.filter(r => r.date === dateStr).map(r => ({
      id: r.id,
      userName: r.userName,
      environmentName: r.environmentName,
      scheduleStartTime: r.scheduleStartTime,
      scheduleEndTime: r.scheduleEndTime,
      entryTime: r.entryTime,
      exitTime: r.exitTime,
      status: r.status,
      delayMinutes: r.delayMinutes,
      fichaNumber: r.fichaNumber,
      date: r.date,
    }));
  }, [userAttendance]);

  const hasExcuseForDate = useCallback((dateStr: string) => {
    return excuses.some(e => e.date === dateStr && e.userId === user?.id);
  }, [excuses, user?.id]);

  const getExcuseForDate = useCallback((dateStr: string) => {
    return excuses.find(e => e.date === dateStr && e.userId === user?.id);
  }, [excuses, user?.id]);

  const monthNames = [
    t('calendar.january'), t('calendar.february'), t('calendar.march'),
    t('calendar.april'), t('calendar.may'), t('calendar.june'),
    t('calendar.july'), t('calendar.august'), t('calendar.september'),
    t('calendar.october'), t('calendar.november'), t('calendar.december'),
  ];

  const dayNames = [
    t('calendar.sundayShort'), t('calendar.mondayShort'), t('calendar.tuesdayShort'),
    t('calendar.wednesdayShort'), t('calendar.thursdayShort'), t('calendar.fridayShort'),
    t('calendar.saturdayShort'),
  ];

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({ day: d, currentMonth: true, date });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  }, [currentDate]);

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1));

  const handleDayPress = (dayData: { day: number; currentMonth: boolean; date: Date }) => {
    if (!dayData.currentMonth) return;
    const records = getRecordsForDay(dayData.date);
    setDayRecords(records);
    setSelectedDay(dayData.date);
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDay(null);
    setDayRecords([]);
  };

  const handleSendExcuse = (record: DayRecord) => {
    if (record.status !== 'absent' || hasExcuseForDate(record.date)) {
      alert(t('reports.excuses.onlyForAbsence'));
      return;
    }
    setSelectedAbsenceRecord(record);
    setExcuseMessage('');
    setExcusePdf(null);
    setShowDayModal(false);
    setExcuseDialogVisible(true);
  };

  const pickExcusePdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const file = result.assets[0];
    if (!file.mimeType?.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      alert(t('reports.excuses.pdfFormatError'));
      return;
    }
    if (file.size && file.size > 5 * 1024 * 1024) {
      alert(t('reports.excuses.pdfSizeError'));
      return;
    }
    setExcusePdf(file.uri);
  };

  const submitExcuse = () => {
    if (!selectedAbsenceRecord || selectedAbsenceRecord.status !== 'absent') {
      alert(t('reports.excuses.onlyForAbsence'));
      return;
    }
    if (!excusePdf) {
      alert(t('reports.excuses.pdfMissing'));
      return;
    }
    if (!excuseMessage.trim() || !user) return;
    
    setSubmittingExcuse(true);
    setTimeout(() => {
      const newExcuse: Excuse = {
        id: `exc-${Date.now()}`,
        date: selectedAbsenceRecord.date,
        userId: user.id,
        message: excuseMessage,
        pdfUrl: excusePdf,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      setExcuses(prev => [...prev, newExcuse]);
      setExcuseDialogVisible(false);
      setExcuseMessage('');
      setExcusePdf(null);
      setSelectedAbsenceRecord(null);
      setSubmittingExcuse(false);
      alert(t('reports.excuses.submitSuccess'));
    }, 500);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'punctual': return Colors.success;
      case 'late': return Colors.warning;
      case 'absent': return Colors.error;
      default: return muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'punctual': return t('reports.statuses.punctual');
      case 'late': return t('reports.statuses.late');
      case 'absent': return t('reports.statuses.absent');
      default: return t('reports.calendarLegend.absent');
    }
  };

  return (
    <View style={[crs.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={crs.backBtn}>
        <Ionicons name="arrow-back" size={20} color={text} />
        <Text style={[crs.backText, { color: text }]}>{t('common.back')}</Text>
      </TouchableOpacity>

      <View style={crs.monthNavWrap}>
        <View style={[crs.header, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity onPress={prevMonth} style={crs.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={text} />
          </TouchableOpacity>
          <Text style={[crs.monthTitle, { color: text }]}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={crs.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color={text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={crs.calendarWrap}>
      <View style={crs.legend}>
        {[
          { c: Colors.success, l: t('reports.calendarLegend.present') },
          { c: Colors.warning, l: t('reports.calendarLegend.late') },
          { c: Colors.error, l: t('reports.calendarLegend.absent') },
        ].map((x, i) => (
          <View key={i} style={crs.legendItem}>
            <View style={[crs.legendDot, { backgroundColor: x.c }]} />
            <Text style={{ color: muted, fontSize: FontSize.sm }}>{x.l}</Text>
          </View>
        ))}
      </View>

      <View style={[crs.grid, { backgroundColor: cardBg, borderColor: border }]}>
        {dayNames.map((d, i) => (
          <View key={i} style={crs.dayHeader}>
            <Text style={[crs.dayHeaderText, { color: muted }]}>{d}</Text>
          </View>
        ))}
        {daysInMonth.map((dayData, i) => {
          const status = dayData.currentMonth ? getDayStatus(dayData.date) : 'none';
          const hasExcuse = dayData.currentMonth ? hasExcuseForDate(dayData.date.toISOString().split('T')[0]) : false;
          
          let bgColor = dayData.currentMonth ? cardBg : 'transparent';
          let borderColor = dayData.currentMonth ? border : 'transparent';
          let textColor = dayData.currentMonth ? text : muted;
          
          if (status === 'present') { bgColor = Colors.success + '15'; borderColor = Colors.success; }
          else if (status === 'late') { bgColor = Colors.warning + '15'; borderColor = Colors.warning; }
          else if (status === 'absent') { bgColor = Colors.error + '15'; borderColor = Colors.error; }

          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleDayPress(dayData)}
              activeOpacity={0.7}
              disabled={!dayData.currentMonth}
              style={[
                crs.dayCell,
                { minHeight: isCompact ? 54 : 86 },
                { backgroundColor: bgColor, borderColor: borderColor },
                !dayData.currentMonth && crs.dayCellDisabled,
              ]}
            >
              <Text style={[crs.dayNum, { color: textColor }]}>{dayData.day}</Text>
              {status !== 'none' && (
                <View style={crs.statusDots}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getStatusColor(status) }} />
                  {hasExcuse && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.primary }} />
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      </View>

      {selectedDay && (
      <Modal visible={showDayModal} transparent animationType="fade" onRequestClose={closeDayModal}>
        <View style={crs.modalOverlay} onTouchStart={closeDayModal}>
          <View style={[crs.modalCard, { backgroundColor: cardBg, borderColor: border }]} onTouchStart={() => {}}>
            <View style={crs.modalHeader}>
              <Text style={[crs.modalTitle, { color: text }]}>{formatDate(selectedDay)}</Text>
              <TouchableOpacity onPress={closeDayModal} style={crs.modalClose}>
                <Ionicons name="close" size={24} color={muted} />
              </TouchableOpacity>
            </View>
            
            {dayRecords.length === 0 ? (
              <View style={crs.modalEmpty}>
                <Ionicons name="calendar-clear-outline" size={48} color={muted} />
                <Text style={{ color: muted, marginTop: 8, textAlign: 'center' }}>{t('reports.noRecordsPeriod')}</Text>
              </View>
            ) : (
              <ScrollView style={crs.modalContent} showsVerticalScrollIndicator={false}>
                {dayRecords.map((record, idx) => (
                  <View key={idx} style={[crs.recordCard, { borderColor: getStatusColor(record.status) }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={crs.recordStatus}>
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getStatusColor(record.status) }} />
                        <Text style={{ color: getStatusColor(record.status), fontWeight: '700', fontSize: 12, marginLeft: 6 }}>
                          {getStatusLabel(record.status)}
                        </Text>
                      </View>
                      <Text style={{ color: muted, fontSize: 12 }}>{record.fichaNumber}</Text>
                    </View>
                    <View style={{ gap: 4, marginTop: 8 }}>
                      <Text style={{ color: text, fontWeight: '600' }}>{record.environmentName}</Text>
                      <Text style={{ color: muted, fontSize: 12 }}>
                        {t('reports.table.entry')}: {record.scheduleStartTime} → {record.entryTime || '--'}
                      </Text>
                      <Text style={{ color: muted, fontSize: 12 }}>
                        {t('reports.table.exit')}: {record.scheduleEndTime} → {record.exitTime || '--'}
                      </Text>
                      {record.delayMinutes > 0 && (
                        <Text style={{ color: Colors.warning, fontSize: 12, fontWeight: '600' }}>
                          {t('reports.table.delay')}: {record.delayMinutes} min
                        </Text>
                      )}
                    </View>
                    {record.status === 'absent' && (
                      <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
                        <AppButton
                          title={t('reports.excuses.send')}
                          onPress={() => handleSendExcuse(record)}
                          variant="primary"
                          style={{ flex: 1 }}
                        />
                        {getExcuseForDate(record.date) && (
                          <AppButton
                            title={getExcuseForDate(record.date)!.status === 'pending' 
                              ? t('reports.excuses.statusPending') 
                              : getExcuseForDate(record.date)!.status === 'approved'
                              ? t('reports.excuses.statusApproved')
                              : t('reports.excuses.statusRejected')}
                            onPress={() => {}}
                            variant="outline"
                            disabled
                            style={{ flex: 1 }}
                          />
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      )}

      <AppDialog
        visible={excuseDialogVisible}
        title={t('reports.excuses.send')}
        message={t('reports.excuses.messagePlaceholder')}
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => setExcuseDialogVisible(false) },
          { text: t('reports.excuses.send'), style: 'default', onPress: submitExcuse },
        ]}
        onRequestClose={() => setExcuseDialogVisible(false)}
        onPressButton={button => button.onPress?.()}
      >
        <TextInput
          value={excuseMessage}
          onChangeText={setExcuseMessage}
          placeholder={t('reports.excuses.messagePlaceholder')}
          placeholderTextColor={muted}
          multiline
          style={[crs.excuseMessageInput, { color: text, borderColor: border, backgroundColor: bg }]}
        />
        <AppButton
          title={excusePdf ? t('reports.excuses.pdfRequired') : t('reports.excuses.attachPdf')}
          onPress={pickExcusePdf}
          variant="outline"
          style={crs.pdfButton}
        />
      </AppDialog>
    </View>
  );
};

const crs = StyleSheet.create({
  safe: { flex: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 12 },
  backText: { fontWeight: '700' },
  monthNavWrap: { width: '100%', maxWidth: 992, alignSelf: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, padding: 16 },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  calendarWrap: { width: '100%', maxWidth: 960, alignSelf: 'center', paddingHorizontal: 16 },
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  dayHeader: { width: '14.285714%', height: 38, alignItems: 'center', justifyContent: 'center' },
  dayHeaderText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  dayCell: { width: '14.285714%', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', padding: 4 },
  dayCellDisabled: { opacity: 0.3 },
  dayNum: { fontSize: 14, fontWeight: FontWeight.bold },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
});
