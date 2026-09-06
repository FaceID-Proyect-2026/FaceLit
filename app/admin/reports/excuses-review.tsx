import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useAttendance } from '@/features/attendance/useAttendance';
import { getFichasSnapshot, subscribe as subscribeAcademic } from '@/features/academic/academicStore';
import { useSyncExternalStore } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppButton from '@/shared/components/ui/AppButton';
import AppDialog from '@/shared/components/ui/AppDialog';
import SelectField from '@/shared/components/ui/SelectField';
import DateField from '@/shared/components/ui/DateField';

interface Excuse {
  id: string;
  userId: string;
  userName: string;
  userDocument: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  pdfUrl: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  reviewComment?: string;
}

export default function ExcusesReviewScreen() {
  const { user, isAuthenticated } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const attendance = useAttendance();
  
  useSyncExternalStore(subscribeAcademic, getFichasSnapshot);

  const fichas = getFichasSnapshot();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? Colors.dark.card : Colors.white;
  const border = isDark ? Colors.dark.border : Colors.light.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  // La fuente real debe ser el servicio de excusas; no se muestran solicitudes ficticias.
  const [excuses, setExcuses] = useState<Excuse[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFicha, setSelectedFicha] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [selectedExcuse, setSelectedExcuse] = useState<Excuse | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewComment, setReviewComment] = useState('');

  const userFichas = useMemo(() => {
    if (!user) return [];
    if (user.role === 'administrador') return fichas;
    if (user.role === 'instructor') {
      return fichas.filter(f => f.learners.some(l => l.id === user.id));
    }
    return fichas.filter(f => f.learners.some(l => l.id === user.id));
  }, [fichas, user]);

  const fichaOptions = useMemo(() => [
    { value: '', label: t('reports.filters.all') },
    ...userFichas.map(f => ({ value: f.number, label: `Ficha ${f.number}` })),
  ], [userFichas]);

  const statusOptions = [
    { value: '', label: t('reports.filters.all') },
    { value: 'pending', label: t('reports.excuses.statusPending') },
    { value: 'approved', label: t('reports.excuses.statusApproved') },
    { value: 'rejected', label: t('reports.excuses.statusRejected') },
  ];

  const filteredExcuses = useMemo(() => {
    return excuses.filter(excuse => {
      if (selectedStatus && excuse.status !== selectedStatus) return false;
      if (dateFrom && excuse.date < dateFrom) return false;
      if (dateTo && excuse.date > dateTo) return false;
      if (selectedFicha) {
        const learner = attendance.find(a => a.userId === excuse.userId && a.date === excuse.date);
        if (!learner || learner.fichaNumber !== selectedFicha) return false;
      }
      return true;
    }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [excuses, selectedStatus, dateFrom, dateTo, selectedFicha, attendance]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login' as any);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const clearFilters = () => {
    setSelectedStatus('');
    setDateFrom('');
    setDateTo('');
    setSelectedFicha('');
  };
  const handleReview = (excuse: Excuse, action: 'approve' | 'reject') => {
    setSelectedExcuse(excuse);
    setReviewAction(action);
    setReviewComment('');
    setReviewDialogVisible(true);
  };

  const confirmReview = () => {
    if (!selectedExcuse) return;
    
    setExcuses(prev => prev.map(e => {
      if (e.id === selectedExcuse.id) {
        return {
          ...e,
          status: reviewAction === 'approve' ? 'approved' : 'rejected',
          reviewedAt: new Date().toISOString(),
          reviewerName: user?.name,
          reviewComment: reviewComment || undefined,
        };
      }
      return e;
    }));
    
    setReviewDialogVisible(false);
    setSelectedExcuse(null);
    setReviewComment('');
    alert(reviewAction === 'approve' ? t('reports.excuses.approveSuccess') : t('reports.excuses.rejectSuccess'));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.warning;
      case 'approved': return Colors.success;
      case 'rejected': return Colors.error;
      default: return muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('reports.excuses.statusPending');
      case 'approved': return t('reports.excuses.statusApproved');
      case 'rejected': return t('reports.excuses.statusRejected');
      default: return status;
    }
  };

  return (
    <View style={[ers.safe, { backgroundColor: bg }]}>
      <View style={ers.pageWrap}>
        <TouchableOpacity onPress={() => router.back()} style={ers.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[ers.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={[ers.title, { color: text }]}>{t('reports.excuses.title')}</Text>

        <View style={[ers.filtersToggle, { backgroundColor: cardBg, borderColor: border }]}>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={ers.toggleBtn}>
            <View style={ers.filterToggleTitle}>
              <Ionicons name="filter-outline" size={18} color={theme.primary} />
              <Text style={[ers.toggleText, { color: text }]}>{t('reports.actions.filter')}</Text>
            </View>
            <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={20} color={muted} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View style={[ers.filtersContent, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={ers.filterRow}>
            <SelectField
              label={t('reports.filters.ficha')}
              value={selectedFicha}
              options={fichaOptions}
              onSelect={setSelectedFicha}
              placeholder={t('reports.filters.all')}
              containerStyle={ers.filterField}
            />
            <SelectField
              label={t('reports.filters.status')}
              value={selectedStatus}
              options={statusOptions}
              onSelect={setSelectedStatus}
              placeholder={t('reports.filters.all')}
              containerStyle={ers.filterField}
            />
            <DateField
              label={t('reports.filters.dateFrom')}
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="AAAA-MM-DD"
              containerStyle={ers.filterField}
            />
            <DateField
              label={t('reports.filters.dateTo')}
              value={dateTo}
              onChange={setDateTo}
              placeholder="AAAA-MM-DD"
              containerStyle={ers.filterField}
            />
          </View>
          {(selectedStatus || dateFrom || dateTo || selectedFicha) && (
            <AppButton
              title={t('reports.actions.clear')}
              onPress={clearFilters}
              variant="outline"
              style={ers.clearBtn}
            />
          )}
        </View>
      )}

      <FlatList
        data={filteredExcuses}
        keyExtractor={e => e.id}
        contentContainerStyle={ers.listContent}
        renderItem={({ item }) => (
          <View style={[ers.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[ers.cardTitle, { color: text }]}>{item.userName}</Text>
                <Text style={{ color: muted, fontSize: 12, marginTop: 2 }}>{item.userDocument}</Text>
              </View>
              <View style={[
                ers.statusBadge,
                { backgroundColor: getStatusColor(item.status) + '20', borderColor: getStatusColor(item.status) }
              ]}>
                <Text style={{ color: getStatusColor(item.status), fontWeight: '700', fontSize: 12 }}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
              <Text style={{ color: muted, fontSize: 12 }}>{item.date}</Text>
              <Text style={{ color: muted, fontSize: 12 }}>
                {t('reports.excuses.submittedAt')}: {new Date(item.submittedAt).toLocaleString()}
              </Text>
              {item.reviewedAt && (
                <Text style={{ color: muted, fontSize: 12 }}>
                  {t('reports.excuses.reviewedAt')}: {new Date(item.reviewedAt).toLocaleString()}
                </Text>
              )}
              {item.reviewerName && (
                <Text style={{ color: muted, fontSize: 12 }}>
                  {t('reports.excuses.reviewer')}: {item.reviewerName}
                </Text>
              )}
            </View>

            <Text style={{ color: text, fontSize: 13, marginTop: 8, lineHeight: 18 }}>
              {t('reports.excuses.message')}: {item.message}
            </Text>

            {item.reviewComment && (
              <Text style={{ color: muted, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>
                {t('reports.excuses.reviewComment')}: {item.reviewComment}
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => alert(t('reports.excuses.pdfUrl') + ': ' + item.pdfUrl)}
                style={ers.pdfBtn}
              >
                <Ionicons name="document-text-outline" size={16} color={theme.primary} />
                <Text style={{ color: theme.primary, fontSize: 12, marginLeft: 4 }}>{t('reports.excuses.attachPdf')}</Text>
              </TouchableOpacity>
              
              {item.status === 'pending' && (
                <>
                  <AppButton
                    title={t('reports.actions.approve')}
                    onPress={() => handleReview(item, 'approve')}
                    variant="primary"
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    title={t('reports.actions.reject')}
                    onPress={() => handleReview(item, 'reject')}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                </>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Ionicons name="document-text-outline" size={48} color={muted} />
            <Text style={{ color: muted, marginTop: 12, fontSize: FontSize.base }}>{t('reports.excuses.noExcuses')}</Text>
          </View>
        }
      />

      <AppDialog
        visible={reviewDialogVisible}
        title={reviewAction === 'approve' ? t('reports.actions.approve') : t('reports.actions.reject')}
        message={reviewAction === 'approve' 
          ? t('reports.excuses.confirmApprove') 
          : t('reports.excuses.confirmReject')}
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => setReviewDialogVisible(false) },
          { 
            text: reviewAction === 'approve' ? t('reports.actions.approve') : t('reports.actions.reject'), 
            style: reviewAction === 'approve' ? 'default' : 'destructive', 
            onPress: confirmReview 
          },
        ]}
        onRequestClose={() => setReviewDialogVisible(false)}
        onPressButton={button => button.onPress?.()}
      >
        <TextInput
          value={reviewComment}
          onChangeText={setReviewComment}
          placeholder={t('reports.excuses.reviewComment')}
          placeholderTextColor={muted}
          multiline
          style={[ers.reviewCommentInput, { color: text, borderColor: border, backgroundColor: bg }]}
        />
      </AppDialog>
    </View>
  );
}

const ers = StyleSheet.create({
  safe: { flex: 1 },
  pageWrap: { width: '100%', maxWidth: 1472, alignSelf: 'center', paddingHorizontal: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 12 },
  backText: { fontWeight: '700' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginTop: 10, marginBottom: 12 },
  filtersToggle: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterToggleTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  filtersContent: { width: '100%', maxWidth: 1440, alignSelf: 'center', borderRadius: 12, borderWidth: 1, padding: 18, marginBottom: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  filterField: { flexBasis: 200, flexGrow: 1, minWidth: 180 },
  clearBtn: { alignSelf: 'flex-start', minWidth: 150 },
  listContent: { width: '100%', maxWidth: 1472, alignSelf: 'center', padding: 16, gap: 10, paddingBottom: 32 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'transparent', borderRadius: 8 },
  reviewCommentInput: { minHeight: 88, borderWidth: 1, borderRadius: 10, padding: 12, textAlignVertical: 'top' },
});
