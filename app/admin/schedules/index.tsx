// ─────────────────────────────────────────────
//  app/admin/schedules/index.tsx — Horarios (Admin)
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useSchedules } from '@/features/schedules/useSchedules';
import ScheduleFormModal from '@/features/schedules/components/ScheduleFormModal';
import { useEnvironments } from '@/features/environments/useEnvironments';
import { useAcademic } from '@/features/academic/useAcademic';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SchedulesListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { schedules, search, setSearch, statusFilter, setStatusFilter, deactivate, reactivate, removePermanently } = useSchedules();
  const { getById: getEnvironment } = useEnvironments();
  const { getFicha } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  // Resuelve el nombre actual del ambiente/ficha contra los módulos reales
  // (Ambientes/Académico). Si la entidad ya no existe (p. ej. fue eliminada
  // permanentemente), se conserva el nombre guardado como respaldo histórico.
  const resolveEnvironmentName = (environmentId: string, fallback: string) =>
    environmentId ? (getEnvironment(environmentId)?.code ?? fallback) : t('schedules.unassigned');
  const resolveInstructorName = (instructorId: string, fallback: string) =>
    instructorId ? fallback : t('schedules.unassigned');
  const resolveFichaNumber = (fichaId: string, fallback: string) => getFicha(fichaId)?.number ?? fallback;

  const openCreateModal = () => { setEditId(undefined); setFormModalOpen(true); };
  const openEditModal = (id: string) => { setEditId(id); setFormModalOpen(true); };

  const handleDeactivate = (id: string) => {
    alert(t('schedules.deactivate'), t('schedules.deactivateConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.deactivate'), style: 'destructive', onPress: () => {
        const r = deactivate(id);
        if (r.success) alert('✓', t('schedules.deactivateSuccess'));
      }},
    ]);
  };

  const handleReactivate = (id: string) => {
    const r = reactivate(id);
    if (r.success) alert('✓', t('schedules.reactivateSuccess'));
    else if (r.error) alert(t('common.error'), t(r.error));
  };

  const handleDeletePermanently = (id: string) => {
    alert(t('schedules.deletePermanently'), t('schedules.deletePermanentlyConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('schedules.deletePermanently'), style: 'destructive', onPress: () => {
        const r = removePermanently(id);
        if (r.success) alert('✓', t('schedules.deleteSuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  const filters: { key: 'all' | 'active' | 'inactive'; label: string }[] = [
    { key: 'all', label: t('environments.filter.all') },
    { key: 'active', label: t('environments.statuses.active') },
    { key: 'inactive', label: t('environments.statuses.inactive') },
  ];

  return (
    <View style={[sls.safe, { backgroundColor: bg }]}>
      <View style={[sls.header, isMobile && sls.headerMobile]}>
        <View style={sls.headingCopy}>
          <Text style={[sls.title, { color: text }]}>{t('schedules.title')}</Text>
          <Text style={[sls.subtitle, { color: muted }]}>{t('schedules.listSubtitle', 'Consulta y administra los horarios de formación registrados en el sistema.')}</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={[sls.addBtn, isMobile && sls.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={Colors.white} /><Text style={sls.addBtnText}>{t('schedules.register')}</Text>
        </TouchableOpacity>
      </View>

      <View style={[sls.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput style={[sls.searchInput, { color: text }] as any} value={search} onChangeText={setSearch}
          placeholder={t('schedules.searchPlaceholder')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
      </View>

      <View style={sls.filterRow}>
        {filters.map(f => (
          <TouchableOpacity key={f.key} onPress={() => setStatusFilter(f.key)}
            style={[sls.filterChip, { backgroundColor: statusFilter === f.key ? theme.primary + '20' : inputBg, borderColor: statusFilter === f.key ? theme.primary : border }]}>
            <Text style={{ color: statusFilter === f.key ? theme.primary : muted, fontWeight: '700', fontSize: 13 }}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={schedules} keyExtractor={s => s.id}
        contentContainerStyle={sls.list}
        renderItem={({ item }) => {
          const environmentName = resolveEnvironmentName(item.environmentId, item.environmentName);
          const instructorName = resolveInstructorName(item.instructorId, item.instructorName);
          const fichaNumber = resolveFichaNumber(item.fichaId, item.fichaNumber);
          return (
            <TouchableOpacity onPress={() => router.push(`/admin/schedules/${item.id}` as any)} activeOpacity={0.7}
              style={[sls.card, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={sls.cardHeader}>
                <View style={[sls.typeBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                  <Text style={[sls.typeText, { color: theme.primary }]}>{t(`schedules.days.${item.day}`)}</Text>
                </View>
                <View style={sls.statusWrap}>
                  <View style={[sls.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                  <Text style={[sls.statusLabel, { color: item.status === 'active' ? Colors.success : Colors.error }]}>{t(`environments.statuses.${item.status}`)}</Text>
                </View>
              </View>

              <View style={sls.titleRow}>
                <Text style={[sls.cardTitle, { color: text }]}>Ficha {fichaNumber} - {item.programName}</Text>
              </View>
              <Text style={[sls.cardSub, { color: muted }]}>{item.startTime} - {item.endTime}</Text>

              <View style={sls.cardFooter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="business-outline" size={13} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{environmentName}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="person-outline" size={13} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{instructorName}</Text></View>
              </View>
              <Text style={[sls.cardDates, { color: muted }]}>{t('environments.detail.createdAt')}: {new Date(item.createdAt).toLocaleString()} · {t('environments.detail.updatedAt')}: {new Date(item.updatedAt).toLocaleString()}</Text>

              <View style={sls.cardActions}>
                <TouchableOpacity onPress={() => router.push(`/admin/schedules/exceptions?scheduleId=${item.id}` as any)} style={[sls.actionBtn, { backgroundColor: Colors.warning + '15' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
                </TouchableOpacity>
                {item.status === 'active' ? (
                  <>
                    <TouchableOpacity onPress={() => openEditModal(item.id)} style={[sls.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                      <Ionicons name="create-outline" size={16} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeactivate(item.id)} style={[sls.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                      <Ionicons name="pause-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => handleReactivate(item.id)} style={[sls.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                      <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeletePermanently(item.id)} style={[sls.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                      <Ionicons name="trash" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={sls.empty}><Text style={{ color: muted }}>{t('schedules.empty')}</Text></View>}
      />
      {DialogUI}
      <ScheduleFormModal visible={formModalOpen} editId={editId} onClose={() => setFormModalOpen(false)} />
    </View>
  );
}

const sls = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  headingCopy: { flex: 1 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  subtitle: { fontSize: FontSize.sm, lineHeight: 19 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnMobile: { justifyContent: 'center', paddingVertical: 13, alignSelf: 'stretch' },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 2 },
  cardSub: { fontSize: FontSize.sm, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  cardDates: { fontSize: FontSize.xs, marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
