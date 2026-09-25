import { findCurrentInstructor, getFichasForInstructor } from '@/features/academic/currentAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { formatDateTime } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function InstructorAcademicScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { programs, allFichas, allInstructors, search, setSearch, statusFilter, setStatusFilter } = useAcademic();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const inputBg = theme.inputBg;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const currentInstructor = useMemo(
    () => findCurrentInstructor(allInstructors, user),
    [allInstructors, user],
  );

  const assignedFichas = useMemo(
    () => getFichasForInstructor(allFichas, currentInstructor),
    [allFichas, currentInstructor],
  );

  const visiblePrograms = useMemo(() => {
    const assignedByProgram = new Map<string, string[]>();
    assignedFichas.forEach(ficha => {
      const ids = assignedByProgram.get(ficha.programId) ?? [];
      ids.push(ficha.id);
      assignedByProgram.set(ficha.programId, ids);
    });

    const term = search.trim().toLowerCase();
    return programs
      .map(program => {
        const fichaIds = assignedByProgram.get(program.id) ?? [];
        return fichaIds.length > 0 ? { ...program, fichas: fichaIds } : null;
      })
      .filter(Boolean)
      .filter(program => {
        if (!program) return false;
        if (statusFilter !== 'all' && program.status !== statusFilter) return false;
        if (!term) return true;
        return getProgramDisplayName(program, t).toLowerCase().includes(term)
          || (program.code ?? '').toLowerCase().includes(term);
      }) as typeof programs;
  }, [assignedFichas, programs, search, statusFilter, t]);

  const filterOptions = [
    { value: 'all' as const, label: t('environments.filter.all') },
    { value: 'active' as const, label: t('environments.filter.active') },
    { value: 'inactive' as const, label: t('environments.filter.inactive') },
  ];

  return (
    <View style={[s.safe, { backgroundColor: bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: text }]}>{t('instructorAcademic.programsTitle')}</Text>
        <Text style={[s.subtitle, { color: muted }]}>
          {t('instructorAcademic.programsSubtitle')}
        </Text>
      </View>

      <View style={[s.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput
          style={[s.searchInput, { color: text }] as any}
          value={search}
          onChangeText={setSearch}
          placeholder={t('instructorAcademic.searchProgram')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
        />
      </View>

      <View style={s.filterRow}>
        {filterOptions.map(option => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setStatusFilter(option.value)}
            style={[
              s.filterChip,
              {
                backgroundColor: statusFilter === option.value ? theme.primary + '20' : inputBg,
                borderColor: statusFilter === option.value ? theme.primary : border,
              },
            ]}
          >
            <Text style={[s.filterChipText, { color: statusFilter === option.value ? theme.primary : muted }]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visiblePrograms}
        keyExtractor={program => program.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/instructor/academic/programs/${item.id}` as any)}
            style={[s.card, { backgroundColor: cardBg, borderColor: border }]}
            activeOpacity={0.75}
          >
            <View style={s.cardHeader}>
              <View style={[s.typeBadge, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="school-outline" size={16} color={theme.primary} />
                <Text style={[s.typeText, { color: theme.primary }]}>
                  {item.fichas.length} {t('instructorAcademic.assignedFichasCount')}
                </Text>
              </View>
              <View style={s.statusWrap}>
                <View style={[s.statusDot, { backgroundColor: item.status === 'active' ? Colors.success : Colors.error }]} />
                <Text style={[s.statusLabel, { color: item.status === 'active' ? Colors.success : Colors.error }]}>
                  {t(`environments.statuses.${item.status}`)}
                </Text>
              </View>
            </View>
            <Text style={[s.cardTitle, { color: text }]}>{getProgramDisplayName(item, t)}</Text>
            <Text style={[s.cardSub, { color: muted }]}>{t('instructorAcademic.created')}: {formatDateTime(item.createdAt, t('instructorAcademic.notRecorded'), i18n.language)}</Text>
            <Text style={[s.cardSub, { color: muted }]}>{t('instructorAcademic.lastEdited')}: {formatDateTime(item.updatedAt, t('instructorAcademic.notRecorded'), i18n.language)}</Text>
            <View style={s.viewHint}>
              <Text style={[s.viewHintText, { color: theme.primary }]}>{t('instructorAcademic.viewFichas')}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.primary} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="school-outline" size={44} color={muted} />
            <Text style={[s.emptyText, { color: muted }]}>{t('instructorAcademic.noPrograms')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  subtitle: { fontSize: FontSize.sm, lineHeight: 19 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.2 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: 6 },
  cardSub: { fontSize: FontSize.xs, marginBottom: 3 },
  viewHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 8 },
  viewHintText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, textAlign: 'center' },
});
