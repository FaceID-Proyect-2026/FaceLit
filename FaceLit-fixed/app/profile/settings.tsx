import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={[ss.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[ss.backText,{color:text}]}>{t('common.back')}</Text></TouchableOpacity>
      <Text style={[ss.title, { color: text }]}>{t('profile.settings')}</Text>

      <View style={[ss.card, { backgroundColor: cardBg, borderColor: border }]}>
        {[
          { icon: 'language-outline', label: t('profile.settingsOptions.language'), right: 'Español' },
          { icon: 'moon-outline', label: t('profile.settingsOptions.theme'), right: isDark ? '🌙 Oscuro' : '☀️ Claro', toggle: true },
          { icon: 'notifications-outline', label: t('profile.settingsOptions.notifications'), right: 'Activadas' },
          { icon: 'accessibility-outline', label: t('profile.settingsOptions.accessibility'), right: 'Predeterminado' },
          { icon: 'lock-closed-outline', label: t('profile.settingsOptions.changePassword'), right: '→' },
        ].map((item, i) => (
          <TouchableOpacity key={i} onPress={item.toggle ? toggleTheme : undefined}
            style={[ss.row, i<4&&{ borderBottomWidth:1,borderBottomColor:border }]} activeOpacity={0.7}>
            <View style={{ flexDirection:'row',alignItems:'center',gap:10,flex:1 }}><Ionicons name={item.icon as any} size={18} color={muted} /><Text style={{ color: text, fontSize: 15, fontWeight:'600' }}>{item.label}</Text></View>
            {item.toggle ? <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false:'#ccc', true:theme.primary }} thumbColor={Colors.white} /> : <Text style={{ color: muted, fontSize: 14 }}>{item.right}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const ss = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  backBtn: { flexDirection:'row',alignItems:'center',gap:4,marginBottom:16 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  card: { borderRadius: 14, borderWidth: 1, padding: 8 },
  row: { flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:14,paddingHorizontal:10 },
});
