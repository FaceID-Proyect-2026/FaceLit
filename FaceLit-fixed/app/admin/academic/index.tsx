// ─────────────────────────────────────────────
//  app/admin/academic/index.tsx — Programas (Admin)
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic, ProgramStatusFilter } from '@/features/academic/useAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function AcademicProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { programs, search, setSearch, statusFilter, setStatusFilter, deactivateProgram, deleteProgram } = useAcademic();
  const { alert, DialogUI } = useAppDialog();
  const { width } = useWindowDimensions();
  const isMobile = width < 480;

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
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
      { text: t('common.yes'), style: 'destructive', onPress: () => {
        const r = deleteProgram(id);
        if (r.success) alert('✓', t('academic.programDeleteCompletelySuccess'));
        else if (r.error) alert(t('common.error'), t(r.error));
      }},
    ]);
  };

  return (
    <View style={[aps.safe, { backgroundColor: bg }]}>
      <View style={[aps.header, isMobile && aps.headerMobile]}>
        <Text style={[aps.title, { color: text }]}>{t('academic.programs')}</Text>
        <View style={[aps.headerButtons, isMobile && aps.headerButtonsMobile]}>
          <TouchableOpacity onPress={() => router.push('/admin/academic/programs/register' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.programRegister')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/admin/academic/fichas/register' as any)} style={[aps.addBtn, isMobile && aps.addBtnMobile, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={aps.addBtnText}>{t('academic.fichaRegister')}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            <View style={aps.cardLeft}>
              <View style={[aps.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="school-outline" size={22} color={theme.primary} />
              </View>
              <View>
                <Text style={[aps.cardTitle, { color: text }]}>{getProgramDisplayName(item, t)}</Text>
                <Text style={[aps.cardMeta, { color: muted }]}>{item.fichas.length} {t('academic.fichas').toLowerCase()} · {t(`environments.statuses.${item.status}`)}</Text>
              </View>
            </View>
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
                <TouchableOpacity onPress={() => handleDeleteCompletely(item.id, getProgramDisplayName(item, t))} style={[aps.actionBtn, { backgroundColor: Colors.error + '15' }]}>
                  <Ionicons name="trash" size={16} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={aps.empty}><Ionicons name="school-outline" size={48} color={muted} /><Text style={[aps.emptyText, { color: muted }]}>{t('academic.programEmpty')}</Text></View>}
      />
      {DialogUI}
    </View>
  );
}

const aps = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerMobile: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerButtonsMobile: { flexDirection: 'column', alignSelf: 'stretch' },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnMobile: { justifyContent: 'center', paddingVertical: 13, alignSelf: 'stretch' },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base },
});
