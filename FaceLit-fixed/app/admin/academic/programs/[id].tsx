import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ProgramDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProgram, allFichas, unlinkFichaFromProgram } = useAcademic();
  const program = getProgram(id ?? '');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!program) return <View style={[pds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>Programa no encontrado</Text></View>;

  const programFichas = allFichas.filter(f => program.fichas.includes(f.id));

  return (
    <View style={[pds.safe, { backgroundColor: bg }]}>
      <FlatList
        data={programFichas}
        keyExtractor={f => f.id}
        contentContainerStyle={pds.scroll}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={pds.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[pds.backText, { color: text }]}>{t('common.back')}</Text></TouchableOpacity>
            <Text style={[pds.title, { color: text }]}>{program.name}</Text>
            <View style={[pds.statusBadge, { backgroundColor: program.status === 'active' ? Colors.success + '20' : Colors.error + '20', alignSelf: 'flex-start', marginBottom: 8 }]}>
              <Text style={{ color: program.status === 'active' ? Colors.success : Colors.error, fontWeight: '700', fontSize: 13 }}>{t(`environments.statuses.${program.status}`)}</Text>
            </View>
            <View style={pds.headerActions}>
              <TouchableOpacity onPress={() => router.push(`/admin/academic/programs/register?id=${program.id}` as any)} style={[pds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={theme.primary} /><Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{t('academic.programEdit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/admin/academic/fichas/register' as any)} style={[pds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="add" size={16} color={theme.primary} /><Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{t('academic.fichaRegister')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[pds.sectionTitle, { color: text, marginTop: 20 }]}>{t('academic.fichas')} ({programFichas.length})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/admin/academic/fichas/${item.id}` as any)}
            style={[pds.card, { backgroundColor: cardBg, borderColor: border }]} activeOpacity={0.7}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={[pds.iconCircle, { backgroundColor: theme.primary + '20' }]}><Ionicons name="document-text-outline" size={20} color={theme.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[pds.cardTitle, { color: text }]}>Ficha {item.number}</Text>
                <Text style={[pds.cardMeta, { color: muted }]}>{t(`academic.jornadas.${item.jornada}`)} · {item.learners.length} aprendices · Código: {item.code}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => { Alert.alert(t('academic.unlinkConfirm')??'', '', [{ text: t('common.cancel'), style: 'cancel' }, { text: t('academic.unlinkFromProgram'), style: 'destructive', onPress: () => unlinkFichaFromProgram(item.id, program.id) }]); }}
              style={{ padding: 6 }}><Ionicons name="link-outline" size={18} color={Colors.warning} /></TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={pds.empty}><Text style={{ color: muted }}>{t('academic.fichaEmpty')}</Text></View>}
      />
    </View>
  );
}

const pds = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardMeta: { fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
});
