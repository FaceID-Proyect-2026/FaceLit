import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { MOCK_NOTIFICATIONS } from '@/features/notifications/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterType>('all');

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const categoryIcons: Record<string,string> = { attendance: 'checkmark-circle-outline', schedule: 'time-outline', environment: 'business-outline', system: 'settings-outline', facial: 'scan-outline' };
  const categoryColors: Record<string,string> = { attendance: Colors.success, schedule: Colors.warning, environment: '#4A90D9', system: '#9B59B6', facial: theme.primary };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id===id ? {...n, read:true} : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({...n, read:true})));

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={[ns.safe, { backgroundColor: bg }]}>
      <View style={[ns.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={text} /></TouchableOpacity>
        <Text style={[ns.title, { color: text }]}>{t('notifications.title')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={[ns.markAllBtn, { backgroundColor: theme.primary+'20' }]}><Text style={{ color: theme.primary, fontWeight:'700', fontSize:12 }}>{t('notifications.markAllRead')}</Text></TouchableOpacity>
        )}
      </View>
      <View style={ns.filters}>
        {(['all','unread','read'] as FilterType[]).map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[ns.filterBtn, { backgroundColor: filter===f ? theme.primary+'20' : 'transparent', borderColor: filter===f ? theme.primary : border }]} activeOpacity={0.7}>
            <Text style={{ color: filter===f ? theme.primary : muted, fontWeight:'700', fontSize:13 }}>
              {t(`notifications.filters.${f}`)} {f==='unread'&&unreadCount>0?`(${unreadCount})`:''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={n => n.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        renderItem={({ item }) => {
          const catColor = categoryColors[item.category] || muted;
          return (
            <TouchableOpacity onPress={() => markAsRead(item.id)}
              style={[ns.card, { backgroundColor: cardBg, borderColor: border, opacity: item.read ? 0.7 : 1 }]} activeOpacity={0.7}>
              <View style={{ flexDirection:'row',gap:12 }}>
                <View style={[ns.iconCircle, { backgroundColor: catColor+'20' }]}><Ionicons name={categoryIcons[item.category] as any} size={18} color={catColor} /></View>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row',justifyContent:'space-between',alignItems:'center' }}>
                    <Text style={[ns.cardTitle, { color: text, fontWeight: item.read?'500':'800' }]}>{item.title}</Text>
                    {!item.read && <View style={{ width:8,height:8,borderRadius:4,backgroundColor:theme.primary }} />}
                  </View>
                  <Text style={{ color: muted, fontSize: 13, marginTop: 2 }}>{item.message}</Text>
                  <Text style={{ color: muted, fontSize: 11, marginTop: 4 }}>{item.date} · {item.time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<View style={{ alignItems:'center',paddingVertical:60 }}><Ionicons name="notifications-off-outline" size={48} color={muted} /><Text style={{ color: muted, marginTop:12 }}>{t('notifications.empty')}</Text></View>}
      />
    </View>
  );
};

const ns = StyleSheet.create({
  safe: { flex: 1 }, header: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  markAllBtn: { paddingHorizontal:10,paddingVertical:5,borderRadius:8 },
  filters: { flexDirection:'row',gap:8,padding:16,paddingBottom:8 },
  filterBtn: { borderRadius:20,borderWidth:1.2,paddingHorizontal:14,paddingVertical:6 },
  card: { borderRadius:12,borderWidth:1,padding:14 },
  iconCircle: { width:36,height:36,borderRadius:10,alignItems:'center',justifyContent:'center' },
  cardTitle: { fontSize: FontSize.base },
});
