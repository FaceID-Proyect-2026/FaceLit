import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { getMyProfile } from '@/shared/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FullProfile {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  useEffect(() => {
    getMyProfile()
      .then(data => {
        setProfile({
          firstName: data.firstName,
          lastName: data.lastName,
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          email: data.email,
        });
      })
      .catch(() => {
        // Si falla, al menos mostramos lo que ya teníamos del login (el email)
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const displayName = profile?.firstName ?? '';
  const displayLastName = profile?.lastName ?? '';
  const documentType = profile?.documentType ?? '';
  const document = profile?.documentNumber ?? '';
  const email = profile?.email ?? user.email ?? '';
  const role = (user as any)?.role ?? '';
  const firstNameInitial = displayName.charAt(0).toUpperCase();
  const lastNameInitial = displayLastName.charAt(0).toUpperCase();
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';
  const avatarText = `${firstNameInitial}${lastNameInitial}`.trim() || (email.charAt(0).toUpperCase() || '?');
  const userName = `${displayName} ${displayLastName}`.trim() || email;

  const handleLogout = () => {
    Alert.alert(t('profile.logoutConfirm') ?? '', '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={[ps.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[ps.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ps.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={ps.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[ps.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={[ps.avatar, { backgroundColor: theme.primary }]}>
            <Text style={ps.avatarText}>{avatarText}</Text>
          </View>
          <Text style={[ps.userName, { color: text }]}>{userName}</Text>
          <View style={[ps.roleBadge, { backgroundColor: theme.primary + '20' }]}>
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>{roleLabel}</Text>
          </View>
        </View>

        <Text style={[ps.sectionTitle, { color: text }]}>{t('profile.personalInfo')}</Text>
        <View style={[ps.card, { backgroundColor: cardBg, borderColor: border }]}>
          {[
            { icon: 'person-outline', label: t('profile.fields.name'), value: displayName },
            { icon: 'people-outline', label: t('profile.fields.lastname'), value: displayLastName },
            { icon: 'card-outline', label: t('profile.fields.documentType'), value: documentType },
            { icon: 'document-text-outline', label: t('profile.fields.document'), value: document },
            { icon: 'mail-outline', label: t('profile.fields.email'), value: email },
          ].map((row, i) => (
            <View key={i} style={[ps.infoRow, i < 4 && { borderBottomWidth: 1, borderBottomColor: border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name={row.icon as any} size={16} color={muted} />
                <Text style={{ color: muted, fontSize: 14 }}>{row.label}</Text>
              </View>
              <Text style={{ color: text, fontWeight: '600', fontSize: 14 }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.push('/profile/settings' as any)} style={[ps.settingsBtn, { borderColor: theme.primary }]} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={18} color={theme.primary} />
          <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('profile.settings')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={[ps.logoutBtn, { borderColor: Colors.error }]} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={{ color: Colors.error, fontWeight: '700' }}>{t('profile.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const ps = StyleSheet.create({
  safe: { flex: 1 }, scroll: { padding: 16, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: FontWeight.black },
  userName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black, marginBottom: 10, marginTop: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginTop: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginTop: 12 },
});