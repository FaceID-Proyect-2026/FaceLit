// ─────────────────────────────────────────────
//  app/profile/index.tsx
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { getMyProfile } from '@/shared/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const { alert, DialogUI } = useAppDialog();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const rowBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const iconBg = isDark ? 'rgba(101,179,97,0.14)' : 'rgba(101,179,97,0.10)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;
  const headerBg = isDark ? '#0D1F14' : '#F0FFF0';

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
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const displayName = profile?.firstName ?? '';
  const displayLastName = profile?.lastName ?? '';
  const documentType = profile?.documentType ?? '';
  const document = profile?.documentNumber ?? '';
  const email = profile?.email ?? (user as any).email ?? '';
  const role = (user as any)?.role ?? '';
  const firstNameInitial = displayName.charAt(0).toUpperCase();
  const lastNameInitial = displayLastName.charAt(0).toUpperCase();
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : '';
  const avatarText = `${firstNameInitial}${lastNameInitial}`.trim() || (email.charAt(0).toUpperCase() || '?');
  const userName = `${displayName} ${displayLastName}`.trim() || email;

  const handleLogout = () => {
    alert(
      t('profile.logoutConfirm') ?? '¿Cerrar sesión?',
      '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const infoRows = [
    { icon: 'person-outline', label: t('profile.fields.name'), value: displayName },
    { icon: 'people-outline', label: t('profile.fields.lastname'), value: displayLastName },
    { icon: 'card-outline', label: t('profile.fields.documentType'), value: documentType },
    { icon: 'document-text-outline', label: t('profile.fields.document'), value: document },
    { icon: 'mail-outline', label: t('profile.fields.email'), value: email },
  ];

  if (loading) {
    return (
      <View style={[ps.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[ps.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ps.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => router.back()} style={ps.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[ps.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* ── Encabezado con avatar ── */}
        <View style={[ps.headerCard, { backgroundColor: headerBg, borderColor: border }]}>
          <View style={ps.headerDecoTop} />

          <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={ps.avatar}>
            <Text style={ps.avatarText}>{avatarText}</Text>
          </LinearGradient>

          <Text style={[ps.userName, { color: text }]}>{userName}</Text>

          <View style={[ps.roleBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '45' }]}>
            <Ionicons name="shield-checkmark" size={13} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 }}>
              {roleLabel}
            </Text>
          </View>
        </View>

        {/* ── Información personal ── */}
        <View style={ps.sectionHeader}>
          <View style={[ps.sectionIconWrap, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="id-card-outline" size={14} color={theme.primary} />
          </View>
          <Text style={[ps.sectionTitle, { color: text }]}>{t('profile.personalInfo')}</Text>
        </View>

        <View style={[ps.card, { backgroundColor: cardBg, borderColor: border }]}>
          {infoRows.map((row, i) => (
            <View
              key={i}
              style={[ps.infoRow, i < infoRows.length - 1 && { borderBottomWidth: 1, borderBottomColor: rowBorder }]}
            >
              <View style={[ps.infoIconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name={row.icon as any} size={17} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[ps.infoLabel, { color: muted }]}>{row.label}</Text>
                <Text style={[ps.infoValue, { color: text }]} numberOfLines={1}>
                  {row.value || '—'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Acciones ── */}
        <TouchableOpacity
          onPress={() => router.push('/profile/settings' as any)}
          style={[ps.actionBtn, { backgroundColor: cardBg, borderColor: border }]}
          activeOpacity={0.75}
        >
          <View style={ps.actionLeft}>
            <View style={[ps.actionIconWrap, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="settings-outline" size={18} color={theme.primary} />
            </View>
            <Text style={[ps.actionText, { color: text }]}>{t('profile.settings')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={muted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={[ps.actionBtn, { backgroundColor: cardBg, borderColor: border, marginTop: 10 }]}
          activeOpacity={0.75}
        >
          <View style={ps.actionLeft}>
            <View style={[ps.actionIconWrap, { backgroundColor: Colors.error + '18' }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            </View>
            <Text style={[ps.actionText, { color: Colors.error, fontWeight: '700' }]}>{t('profile.logout')}</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {DialogUI}
    </View>
  );
}

const ps = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  headerCard: {
    borderRadius: 22, borderWidth: 1, alignItems: 'center',
    paddingVertical: 32, paddingHorizontal: 20, marginBottom: 24,
    overflow: 'hidden',
  },
  headerDecoTop: {
    position: 'absolute', top: -60, right: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(101,179,97,0.08)',
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#4FA14B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  userName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 10, textAlign: 'center' },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.2,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.black },

  card: { borderRadius: 18, borderWidth: 1, padding: 6, marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 12, marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '700' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '700' },
});