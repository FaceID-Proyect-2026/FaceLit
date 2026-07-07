import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  if (!user) return null;

  const handleLogout = () => {
    Alert.alert(t('profile.logoutConfirm')??'', '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[ps.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ps.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={ps.backBtn}><Ionicons name="arrow-back" size={20} color={text} /><Text style={[ps.backText,{color:text}]}>{t('common.back')}</Text></TouchableOpacity>

        {/* Avatar */}
        <View style={{ alignItems:'center',marginBottom:24 }}>
          <View style={[ps.avatar, { backgroundColor: theme.primary }]}><Text style={ps.avatarText}>{user.name.charAt(0)}{user.lastname.charAt(0)}</Text></View>
          <Text style={[ps.userName, { color: text }]}>{user.name} {user.lastname}</Text>
          <View style={[ps.roleBadge, { backgroundColor: theme.primary+'20' }]}><Text style={{ color: theme.primary, fontWeight:'700',fontSize:13 }}>{user.role.charAt(0).toUpperCase()+user.role.slice(1)}</Text></View>
        </View>

        {/* Info */}
        <Text style={[ps.sectionTitle, { color: text }]}>{t('profile.personalInfo')}</Text>
        <View style={[ps.card, { backgroundColor: cardBg, borderColor: border }]}>
          {[
            { icon: 'person-outline', label: t('profile.fields.name'), value: user.name },
            { icon: 'people-outline', label: t('profile.fields.lastname'), value: user.lastname },
            { icon: 'card-outline', label: t('profile.fields.documentType'), value: user.documentType },
            { icon: 'document-text-outline', label: t('profile.fields.document'), value: user.document },
            { icon: 'mail-outline', label: t('profile.fields.email'), value: user.email },
          ].map((row,i) => (
            <View key={i} style={[ps.infoRow, i<4&&{ borderBottomWidth:1,borderBottomColor:border }]}>
              <View style={{ flexDirection:'row',alignItems:'center',gap:8,flex:1 }}><Ionicons name={row.icon as any} size={16} color={muted} /><Text style={{ color: muted,fontSize:14 }}>{row.label}</Text></View>
              <Text style={{ color: text,fontWeight:'600',fontSize:14 }}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Settings link */}
        <TouchableOpacity onPress={() => router.push('/profile/settings' as any)} style={[ps.settingsBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={18} color={theme.primary} /><Text style={{ color: theme.primary, fontWeight:'700' }}>{t('profile.settings')}</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={[ps.logoutBtn, { borderColor: Colors.error }]} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} /><Text style={{ color: Colors.error, fontWeight:'700' }}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const ps = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection:'row',alignItems:'center',gap:4,marginBottom:20 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems:'center',justifyContent:'center',marginBottom:12 },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: FontWeight.black },
  userName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 10, marginTop: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  infoRow: { flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical: 10 },
  settingsBtn: { flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderWidth:1.5,borderRadius:12,paddingVertical:12,marginTop:20 },
  logoutBtn: { flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,borderWidth:1.5,borderRadius:12,paddingVertical:12,marginTop:12 },
});
