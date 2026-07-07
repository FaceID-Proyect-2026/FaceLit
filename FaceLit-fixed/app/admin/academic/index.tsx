// ─────────────────────────────────────────────
//  app/admin/academic/index.tsx — Programas (Admin)
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function AcademicProgramsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { programs, search, setSearch, deleteProgram } = useAcademic();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const inputBg = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const handleDelete = (id: string, name: string) => {
    Alert.alert(t('academic.programDelete'), name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.yes'), style: 'destructive', onPress: () => {
        const r = deleteProgram(id);
        if (!r.success) Alert.alert(t('common.error'), r.error);
      }},
    ]);
  };

  return (
    <View style={[aps.safe, { backgroundColor: bg }]}>
      <View style={aps.header}>
        <Text style={[aps.title, { color: text }]}>{t('academic.programs')}</Text>
        <TouchableOpacity onPress={() => router.push('/admin/academic/programs/register' as any)} style={[aps.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={aps.addBtnText}>{t('academic.programRegister')}</Text>
        </TouchableOpacity>
      </View>
      <View style={[aps.searchWrap, { backgroundColor: inputBg, borderColor: border }]}>
        <Ionicons name="search-outline" size={18} color={muted} />
        <TextInput style={[aps.searchInput, { color: text }] as any} value={search} onChangeText={setSearch}
          placeholder="Buscar programa..." placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'} />
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
                <Text style={[aps.cardTitle, { color: text }]}>{item.name}</Text>
                <Text style={[aps.cardMeta, { color: muted }]}>{item.fichas.length} {t('academic.fichas').toLowerCase()} · {t(`environments.statuses.${item.status}`)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={aps.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={aps.empty}><Ionicons name="school-outline" size={48} color={muted} /><Text style={[aps.emptyText, { color: muted }]}>{t('academic.programEmpty')}</Text></View>}
      />
    </View>
  );
}

const aps = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontSize: FontSize.md, outlineStyle: 'none' } as any,
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  deleteBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base },
});
