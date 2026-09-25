import { findCurrentInstructor, getFichasForInstructor } from '@/features/academic/currentAcademic';
import { getProgramDisplayName } from '@/features/academic/types';
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { formatDateTime } from '@/shared/utils/dates';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function InstructorProgramDetailScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProgram, allFichas, allInstructors } = useAcademic();
  const [fichaSearch, setFichaSearch] = useState('');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const program = getProgram(id ?? '');

  const currentInstructor = useMemo(
    () => findCurrentInstructor(allInstructors, user),
    [allInstructors, user],
  );
  const programFichas = useMemo(() => {
    if (!program) return [];
    const term = fichaSearch.trim().toLowerCase();
    return getFichasForInstructor(allFichas, currentInstructor)
      .filter(ficha => ficha.programId === program.id)
      .filter(ficha => {
        if (!term) return true;
        return ficha.number.toLowerCase().includes(term) || ficha.code.toLowerCase().includes(term);
      });
  }, [allFichas, currentInstructor, fichaSearch, program]);

  if (!program) {
    return (
      <View style={[s.safe, s.center, { backgroundColor: bg }]}>
        <Text style={{ color: muted }}>{t('instructorAcademic.programUnavailable')}</Text>
      </View>
    );
  }

  return (
    <View style={[s.safe, { backgroundColor: bg }]}>
      <FlatList
        data={programFichas}
        keyExtractor={ficha => ficha.id}
        contentContainerStyle={s.scroll}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={text} />
              <Text style={[s.backText, { color: text }]}>{t('common.back')}</Text>
            </TouchableOpacity>

            <View style={[s.headerCard, { backgroundColor: cardBg, borderColor: border }]}>
              <View style={s.headerTop}>
                <View style={[s.iconCircleLg, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="school" size={26} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.title, { color: text }]}>{getProgramDisplayName(program, t)}</Text>
                  <Text style={[s.subtitle, { color: muted }]}>{t('instructorAcademic.programSubtitle')}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: program.status === 'active' ? Colors.success + '20' : Colors.error + '20' }]}>
                  <View style={[s.statusDot, { backgroundColor: program.status === 'active' ? Colors.success : Colors.error }]} />
                  <Text style={{ color: program.status === 'active' ? Colors.success : Colors.error, fontWeight: '700', fontSize: 13 }}>
                    {t(`environments.statuses.${program.status}`)}
                  </Text>
                </View>
              </View>

              <View style={[s.infoRow, { borderBottomColor: border }]}>
                <Text style={[s.infoLabel, { color: muted }]}>{t('instructorAcademic.fichasAssigned')}</Text>
                <Text style={[s.infoValue, { color: text }]}>{programFichas.length}</Text>
              </View>
              <View style={[s.infoRow, { borderBottomColor: border }]}>
                <Text style={[s.infoLabel, { color: muted }]}>{t('instructorAcademic.created')}</Text>
                <Text style={[s.infoValue, { color: text }]}>{formatDateTime(program.createdAt, t('instructorAcademic.notRecorded'), i18n.language)}</Text>
              </View>
              <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[s.infoLabel, { color: muted }]}>{t('instructorAcademic.lastEdited')}</Text>
                <Text style={[s.infoValue, { color: text }]}>{formatDateTime(program.updatedAt, t('instructorAcademic.notRecorded'), i18n.language)}</Text>
              </View>
            </View>

            <View style={[s.searchWrap, { backgroundColor: theme.inputBg, borderColor: border }]}>
              <Ionicons name="search-outline" size={18} color={muted} />
              <TextInput
                value={fichaSearch}
                onChangeText={setFichaSearch}
                placeholder={t('instructorAcademic.searchFicha')}
                placeholderTextColor={muted}
                style={[s.searchInput, { color: text }] as any}
              />
            </View>

            <Text style={[s.sectionTitle, { color: text }]}>{t('instructorAcademic.fichasTitle', { count: programFichas.length })}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/instructor/academic/fichas/${item.id}` as any)}
            style={[s.card, { backgroundColor: cardBg, borderColor: border }]}
            activeOpacity={0.75}
          >
            <View style={[s.iconCircle, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: text }]}>{t('academic.ficha')} {item.number}</Text>
              <Text style={[s.cardMeta, { color: muted }]}>{item.learners.length} {t('instructorAcademic.learners')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ color: muted }}>{t('instructorAcademic.noFichas')}</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  headerCard: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  iconCircleLg: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 4, flexShrink: 1, flexWrap: 'wrap' },
  subtitle: { fontSize: FontSize.sm, lineHeight: 18 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, gap: 12 },
  infoLabel: { fontSize: FontSize.sm },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, textAlign: 'right', flex: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
});
