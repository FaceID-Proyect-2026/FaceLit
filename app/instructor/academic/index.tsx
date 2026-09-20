// ─────────────────────────────────────────────
//  app/admin/academic/index.tsx — Programas (Admin)
// ─────────────────────────────────────────────
import FichaFormModal from '@/features/academic/components/FichaFormModal';
import ProgramFormModal from '@/features/academic/components/ProgramFormModal';
import { getProgramDisplayName } from '@/features/academic/types';
import { ProgramStatusFilter, useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { isRecent, wasEditedRecently } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

export default function AcademicProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const {
    programs, search, setSearch, statusFilter, setStatusFilter, deactivateProgram, reactivateProgram, deleteProgram, deactivateFicha, reactivateFicha, deleteFicha,
  } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [fichaModalOpen, setFichaModalOpen] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const inputBg = theme.inputBg;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const filterOptions: { value: ProgramStatusFilter; label: string }[] = [
    { value: 'all', label: t('environments.filter.all') },
    { value: 'active', label: t('environments.filter.active') },
    { value: 'inactive', label: t('environments.filter.inactive') },
  ];

  // Eliminar (desactivación lógica) — solo disponible para programas Activos.
  const handleDeactivate = (id: string, name: string) => {
    alert(t('academic.programDelete'), `${name}\n\n${t('academic.programDeactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.programDelete'), style: 'destructive', onPress: () => {
        deactivateProgram(id);
      }},
    ]);
  };

  // Eliminar completamente — solo disponible para programas Inactivos.
  const handleDeleteCompletely = (id: string, name: string) => {
    alert(t('academic.programDeleteCompletely'), `${name}\n\n${t('academic.programDeleteCompletelyConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: async () => {
        try {
          await deleteProgram(id);
          alert('✓', t('academic.programDeleteCompletelySuccess'));
        } catch (error: any) {
          alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo eliminar el programa.');
        }
      }},
    ]);
  };

  const handleReactivate = (id: string, name: string) => {
    alert(t('academic.alreadyActive'), `${name}\n\n${t('environments.reactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: () => reactivateProgram(id) },
    ]);
  };

  const handleReactivateFicha = (id: string, number: string) => {
    alert(t('academic.alreadyActive'), `${number}\n\n${t('environments.reactivateConfirm')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('environments.reactivate'), onPress: () => reactivateFicha(id) },
    ]);
  };

  const handleDeactivateFicha = (id: string, number: string) => {
    alert(t('academic.deactivateFicha'), `${number}\n\n${t('academic.confirmDeactivateFicha')}`, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.deactivateFicha'), style: 'destructive', onPress: () => deactivateFicha(id) },
    ]);
  };

  // Eliminar completamente — solo disponible para fichas Inactivas.
  const handleDeleteFichaCompletely = (id: string, number: string) => {
    alert(t('academic.fichaDeleteCompletely'), `${number}\n\n${t('academic.fichaDeleteCompletelyConfirm')}`, [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: async () => {
        try {
          await deleteFicha(id);
          alert('✓', t('academic.fichaDeleteCompletelySuccess'));
        } catch (error: any) {
          alert(t('common.error'), error?.response?.data?.message ?? 'No se pudo eliminar la ficha.');
        }
      }},
    ]);
  };

  const tabTitles = {
    programs: t('academic.programs'),
  };
  const tabSubtitles = {
    programs: t('academic.programsListSubtitle', 'Consulta, filtra y administra los programas de formación y sus fichas asociadas.'),
  };

  return (
    <View style={[aps.safe, { backgroundColor: bg }]}>
      <View style={[aps.header, isMobile && aps.headerMobile]}>
        <View style={aps.headingCopy}>
          <Text style={[aps.title, { color: text }]}>{tabTitles.programs}</Text>
          <Text style={[aps.subtitle, { color: muted }]}>{tabSubtitles.programs}</Text>
        </View>
        <View style={[aps.headerButtons, isMobile && aps.headerButtonsMobile]}>
          <TouchableOpacity onPress={() => setProgramModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.programRegister')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFichaModalOpen(true)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.fichaRegister')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <>
        <View style={[aps.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
            <Ionicons name="search-outline" size={18} color={muted} />
            <TextInput style={[aps.searchInput, { color: text }] as any} value={search} onChangeText={setSearch}
              placeholder={t('academic.searchProgram')} placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
          </View>

          <View style={aps.filterRow}>
            {filterOptions.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatusFilter(opt.value)}
                style={[
                  aps.filterChip,
                  {
                    backgroundColor: statusFilter === opt.value ? theme.primary + '20' : inputBg,
                    borderColor: statusFilter === opt.value ? theme.primary : border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[aps.filterChipText, { color: statusFilter === opt.value ? theme.primary : muted }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList data={programs} keyExtractor={p => p.id}
            contentContainerStyle={aps.list}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => router.push(`/admin/academic/programs/${item.id}` as any)}
                style={[aps.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
                <View style={aps.cardHeader}>
                  <View style={[aps.typeBadge, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="school-outline" size={16} color={theme.primary} />
                    <Text style={[aps.typeText, { color: theme.primary }]}>{item.fichas.length} {t('academic.fichas').toLowerCase()}</Text>
                  </View>
                  <View style={aps.statusWrap}>
                    <View style={[aps.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                    <Text style={[aps.statusLabel, { color: item.status === 'active' ? Colors.success : Colors.error }]}>{t(`environments.statuses.${item.status}`)}</Text>
                  </View>
                </View>
                {(isRecent(item.createdAt) || wasEditedRecently(item.createdAt, item.updatedAt)) && (
                  <View style={aps.badgeRow}>
                    {isRecent(item.createdAt) && <View style={[aps.infoBadge, { backgroundColor: theme.primary + '18' }]}>
                      <Ionicons name="sparkles-outline" size={12} color={theme.primary} />
                      <Text style={[aps.infoBadgeText, { color: theme.primary }]}>{t('environments.recentBadge')}</Text>
                    </View>}
                    {wasEditedRecently(item.createdAt, item.updatedAt) && <View style={[aps.infoBadge, { backgroundColor: '#8A6D3B18' }]}>
                      <Ionicons name="create-outline" size={12} color="#B8860B" />
                      <Text style={[aps.infoBadgeText, { color: theme.warning }]}>{t('environments.editedRecentlyBadge')}</Text>
                    </View>}
                  </View>
                )}
                <View style={aps.titleRow}>
                  <Text style={[aps.cardTitle, { color: text }]}>{getProgramDisplayName(item, t)}</Text>
                </View>
                <Text style={[aps.cardSub, { color: muted }]}>{t('environments.detail.createdAt')}: {new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={[aps.cardDates, { color: muted }]}>{t('environments.detail.updatedAt')}: {new Date(item.updatedAt).toLocaleString()}</Text>
                <View style={aps.cardActions}>
                  <TouchableOpacity onPress={() => router.push(`/admin/academic/programs/${item.id}` as any)} style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="eye-outline" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  {item.status === 'active' && (
                    <TouchableOpacity onPress={() => handleDeactivate(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                  {item.status === 'inactive' && (
                    <><TouchableOpacity onPress={() => handleReactivate(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: theme.primary + '15' }]}><Ionicons name="refresh-outline" size={16} color={theme.primary} /></TouchableOpacity><TouchableOpacity onPress={() => handleDeleteCompletely(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}><Ionicons name="trash" size={16} color={Colors.error} /></TouchableOpacity></>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<View style={aps.empty}><Ionicons name="school-outline" size={48} color={muted} /><Text style={[aps.emptyText, { color: muted }]}>{t('academic.programEmpty')}</Text></View>}
          />
        </>

      {DialogUI}
      <ProgramFormModal visible={programModalOpen} onClose={() => setProgramModalOpen(false)} />
      <FichaFormModal visible={fichaModalOpen} onClose={() => setFichaModalOpen(false)} />
    </View>
  );
}

const aps = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButtonsMobile: { flexDirection: 'column', alignSelf: 'stretch' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  headingCopy: { flex: 1 },
  subtitle: { fontSize: FontSize.sm, lineHeight: 19 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnMobile: { justifyContent: 'center', paddingVertical: 13, alignSelf: 'stretch' },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  tabRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 4, marginBottom: 8, flexWrap: 'wrap' },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.2, flexShrink: 1 },
  tabChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, flexShrink: 1 },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  infoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  infoBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  unlinkedCard: { flexDirection: 'column', alignItems: 'stretch' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 2 },
  cardSub: { fontSize: FontSize.sm, marginBottom: 4 },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  cardDates: { fontSize: FontSize.xs, marginBottom: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  recentBadge: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  cardActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  programPicker: { marginTop: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(101,179,97,0.15)', paddingTop: 12 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 12 },
  programOption: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1.2, paddingHorizontal: 12, paddingVertical: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base },
});