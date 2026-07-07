import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAcademic } from '@/features/academic/useAcademic';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function FichaDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getFicha, programs, removeLearner } = useAcademic();
  const ficha = getFicha(id ?? '');
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!ficha) return <View style={[fds.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ color: muted }}>Ficha no encontrada</Text></View>;

  const program = programs.find(p => p.id === ficha.programId);

  const handleDesvincular = (learnerId: string, name: string) => {
    Alert.alert(t('academic.desvincularConfirm')??'', name, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('academic.desvincular'), style: 'destructive', onPress: () => removeLearner(ficha.id, learnerId) },
    ]);
  };

  return (
    <View style={[fds.safe, { backgroundColor: bg }]}>
      <FlatList
        data={ficha.learners}
        keyExtractor={l => l.id}
        contentContainerStyle={fds.scroll}
        ListHeaderComponent={
          <View>
            <TouchableOpacity onPress={() => router.back()} style={fds.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[fds.backText, { color: text }]}>{t('common.back')}</Text></TouchableOpacity>
            <View style={[fds.card, { backgroundColor: cardBg, borderColor: border }]}>
              <Text style={[fds.fichaTitle, { color: text }]}>Ficha {ficha.number}</Text>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Programa</Text><Text style={[fds.infoValue, { color: text }]}>{program?.name ?? 'Sin programa'}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Jornada</Text><Text style={[fds.infoValue, { color: text }]}>{t(`academic.jornadas.${ficha.jornada}`)}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>{t('academic.fichaCode')}</Text><Text style={[fds.infoValue, { color: theme.primary, fontWeight: '800' }]}>{ficha.code}</Text></View>
              <View style={fds.infoRow}><Text style={[fds.infoLabel, { color: muted }]}>Estado</Text><Text style={{ color: ficha.status==='active'?Colors.success:Colors.error, fontWeight:'700' }}>{t(`environments.statuses.${ficha.status}`)}</Text></View>
            </View>
            <View style={fds.headerActions}>
              <TouchableOpacity onPress={() => router.push(`/admin/academic/fichas/register?id=${ficha.id}` as any)} style={[fds.actionBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={theme.primary} /><Text style={{ color: theme.primary, fontWeight:'700', fontSize: 13 }}>{t('academic.fichaEdit')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[fds.sectionTitle, { color: text }]}>{t('academic.learners')} ({ficha.learners.length})</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[fds.learnerCard, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[fds.learnerName, { color: text }]}>{item.name} {item.lastname}</Text>
              <Text style={[fds.learnerMeta, { color: muted }]}>Doc: {item.document} · {item.email}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Text style={{ color: muted, fontSize: 12 }}>{item.role}</Text>
                <Text style={{ color: item.status==='active'?Colors.success:Colors.error, fontSize: 12, fontWeight:'700' }}>{t(`environments.statuses.${item.status}`)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDesvincular(item.id, item.name)} style={{ padding: 8 }}>
              <Ionicons name="person-remove-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<View style={fds.empty}><Text style={{ color: muted }}>{t('academic.learnerEmpty')}</Text></View>}
      />
    </View>
  );
}

const fds = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  fichaTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  infoLabel: { fontSize: FontSize.md },
  infoValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  headerActions: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.black, marginBottom: 10 },
  learnerCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  learnerName: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  learnerMeta: { fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 40 },
});
