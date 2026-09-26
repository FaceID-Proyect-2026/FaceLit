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

export default function InstructorFichaDetailScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getFicha, programs, allFichas, allInstructors } = useAcademic();
  const [learnerSearch, setLearnerSearch] = useState('');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const currentInstructor = useMemo(
    () => findCurrentInstructor(allInstructors, user),
    [allInstructors, user],
  );
  const allowedFichaIds = useMemo(
    () => new Set(getFichasForInstructor(allFichas, currentInstructor).map(ficha => ficha.id)),
    [allFichas, currentInstructor],
  );

  const ficha = getFicha(id ?? '');
  const canView = Boolean(ficha && allowedFichaIds.has(ficha.id));
  const program = ficha ? programs.find(item => item.id === ficha.programId) : null;
  const learners = useMemo(() => {
    if (!ficha) return [];
    const term = learnerSearch.trim().toLowerCase();
    return ficha.learners.filter(learner => {
      if (!term) return true;
      return `${learner.name} ${learner.lastname}`.toLowerCase().includes(term)
        || learner.document.toLowerCase().includes(term)
        || learner.email.toLowerCase().includes(term);
    });
  }, [ficha, learnerSearch]);

  if (!ficha || !canView) {
    return (
      <View style={[s.safe, s.center, { backgroundColor: bg }]}>
        <Text style={{ color: muted }}>{t('instructorAcademic.fichaUnavailable')}</Text>
      </View>
    );
  }

  return (
    <View style={[s.safe, { backgroundColor: bg }]}>
      <FlatList
        data={learners}
        keyExtractor={learner => learner.id}
        contentContainerStyle={s.scroll}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={text} />
              <Text style={[s.backText, { color: text }]}>{t('common.back')}</Text>
            </TouchableOpacity>

            <View style={[s.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[s.fichaTitle, { color: text }]}>{t('academic.ficha')} {ficha.number}</Text>
              <Text style={[s.fichaSubtitle, { color: muted }]}>{t('instructorAcademic.fichaSubtitle')}</Text>
              <View style={[s.infoRow, { borderBottomColor: border }]}>
                <Text style={[s.infoLabel, { color: muted }]}>{t('instructorAcademic.program')}</Text>
                <Text style={[s.infoValue, { color: text }]}>{program ? getProgramDisplayName(program, t) : t('instructorAcademic.noProgram')}</Text>
              </View>
              <View style={[s.infoRow, { borderBottomColor: border }]}>
                <Text style={[s.infoLabel, { color: muted }]}>{t('instructorAcademic.status')}</Text>
                <Text style={{ color: ficha.status === 'active' ? Colors.success : Colors.error, fontWeight: '700' }}>
                  {t(`environments.statuses.${ficha.status}`)}
                </Text>
              </View>
              <View style={[s.infoRow, { borderBottomColor: border }]}>
                <Text style={[s.infoLabel, { color: muted }]}>{t('instructorAcademic.created')}</Text>
                <Text style={[s.infoValue, { color: text }]}>{formatDateTime(ficha.createdAt)}</Text>
              </View>
              <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={[s.infoLabel, { color: muted }]}>{t('instructorAcademic.lastEdited')}</Text>
                <Text style={[s.infoValue, { color: text }]}>{formatDateTime(ficha.updatedAt)}</Text>
              </View>
            </View>

            <View style={[s.searchWrap, { backgroundColor: theme.inputBg, borderColor: border }]}>
              <Ionicons name="search-outline" size={18} color={muted} />
              <TextInput
                value={learnerSearch}
                onChangeText={setLearnerSearch}
                placeholder={t('instructorAcademic.searchLearner')}
                placeholderTextColor={muted}
                style={[s.searchInput, { color: text }] as any}
              />
            </View>

            <Text style={[s.sectionTitle, { color: text }]}>{t('instructorAcademic.learnersTitle', { count: learners.length })}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.learnerCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={[s.avatar, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="person-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.learnerName, { color: text }]}>{item.name} {item.lastname}</Text>
              <Text style={[s.learnerMeta, { color: muted }]}>{t('instructorAcademic.document')}: {item.document}{item.email ? ` - ${item.email}` : ''}</Text>
              {item.createdAt ? <Text style={[s.learnerMeta, { color: muted }]}>{t('instructorAcademic.added')}: {formatDateTime(item.createdAt)}</Text> : null}
              <Text style={{ color: item.status === 'active' ? Colors.success : Colors.error, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                {t(`environments.statuses.${item.status}`)}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ color: muted }}>{t('instructorAcademic.noLearners')}</Text>
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
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  fichaTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 8 },
  fichaSubtitle: { fontSize: FontSize.sm, marginBottom: 12, lineHeight: 19 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, gap: 12 },
  infoLabel: { fontSize: FontSize.md },
  infoValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, textAlign: 'right', flex: 1 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: FontSize.sm, outlineStyle: 'none' } as any,
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10 },
  learnerCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  learnerName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  learnerMeta: { fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
});
