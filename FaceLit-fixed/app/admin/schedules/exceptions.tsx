import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_EXCEPTIONS } from '@/features/schedules/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ScheduleExceptionsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[ses.safe, { backgroundColor: bg }]}>
      <View style={ses.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={text} /></TouchableOpacity>
        <Text style={[ses.title, { color: text }]}>{t('schedules.exceptions')}</Text>
        <TouchableOpacity style={[ses.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={Colors.white} /><Text style={ses.addBtnText}>{t('schedules.exceptionRegister')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={MOCK_EXCEPTIONS} keyExtractor={e => e.id}
        contentContainerStyle={ses.list}
        renderItem={({ item }) => (
          <View style={[ses.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection:'row',alignItems:'center',gap:8,marginBottom:8 }}>
              <Ionicons name="alert-circle" size={18} color={Colors.warning} />
              <Text style={[ses.cardTitle, { color: text }]}>{t(`schedules.exceptionTypes.${item.type}`)}</Text>
            </View>
            <Text style={[ses.cardText, { color: muted }]}>Fecha: {item.date} · {item.reason}</Text>
            {item.replacementInstructor && <Text style={[ses.cardText, { color: muted }]}>Reemplazo: {item.replacementInstructor}</Text>}
          </View>
        )}
        ListEmptyComponent={<View style={ses.empty}><Text style={{ color: muted }}>Sin excepciones</Text></View>}
      />
    </View>
  );
};

const ses = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  addBtn: { flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:10,paddingVertical:6,borderRadius:8 },
  addBtnText: { color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardText: { fontSize: FontSize.sm, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
});
