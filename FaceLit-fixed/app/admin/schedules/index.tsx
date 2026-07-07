import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_SCHEDULES, MOCK_INSTRUCTORS } from '@/features/schedules/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const DAYS: Record<string,string> = { monday:'Lunes', tuesday:'Martes', wednesday:'Miércoles', thursday:'Jueves', friday:'Viernes', saturday:'Sábado' };

export default function SchedulesListScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [schedules] = useState(MOCK_SCHEDULES);
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[sls.safe, { backgroundColor: bg }]}>
      <View style={sls.header}>
        <Text style={[sls.title, { color: text }]}>{t('schedules.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/admin/schedules/register' as any)} style={[sls.addBtn, { backgroundColor: theme.primary }]} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={Colors.white} /><Text style={sls.addBtnText}>{t('schedules.register')}</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={schedules} keyExtractor={s => s.id}
        contentContainerStyle={sls.list}
        renderItem={({ item }) => (
          <View style={[sls.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={[sls.dayBadge, { backgroundColor: theme.primary+'20' }]}>
                <Text style={{ color: theme.primary, fontWeight:'800', fontSize:12 }}>{DAYS[item.day]?.slice(0,3).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[sls.cardTitle, { color: text }]}>Ficha {item.fichaNumber} - {item.programName}</Text>
                <Text style={[sls.cardTime, { color: muted }]}>{item.startTime} - {item.endTime}</Text>
              </View>
            </View>
            <View style={sls.cardFooter}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="business-outline" size={13} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{item.environmentName}</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="person-outline" size={13} color={muted} /><Text style={{ color: muted, fontSize: 12 }}>{item.instructorName}</Text></View>
            </View>
          </View>
        )}
        ListEmptyComponent={<View style={sls.empty}><Text style={{ color: muted }}>{t('schedules.empty')}</Text></View>}
      />
      <TouchableOpacity onPress={() => router.push('/admin/schedules/exceptions' as any)} style={[sls.exBtn, { borderColor: Colors.warning }]} activeOpacity={0.7}>
        <Ionicons name="alert-circle-outline" size={18} color={Colors.warning} /><Text style={{ color: Colors.warning, fontWeight:'700' }}>{t('schedules.exceptions')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const sls = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:16,paddingBottom:8 },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  addBtn: { flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:14,paddingVertical:10,borderRadius:12 },
  addBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  list: { padding: 16, gap: 10 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  cardTime: { fontSize: FontSize.sm, marginTop: 2 },
  cardFooter: { flexDirection: 'row', gap: 16, marginTop: 6 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  exBtn: { flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderWidth:1.5,borderRadius:12,paddingVertical:12,marginHorizontal:16,marginBottom:16 },
});
