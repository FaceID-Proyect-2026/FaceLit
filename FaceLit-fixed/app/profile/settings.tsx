// ─────────────────────────────────────────────
//  app/profile/settings.tsx
// ─────────────────────────────────────────────
import { useUserSettings } from '@/features/profile/useUserSettings';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const { notificationsActive, changeTheme, changeLanguage, changeNotifications } = useUserSettings();

  const [showLanguages, setShowLanguages] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const currentLangLabel = LANGUAGES.find(l => l.code === i18n.language)?.label ?? 'Español';

  return (
    <View style={[ss.safe, { backgroundColor: bg }]}>
      <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
        <Ionicons name="arrow-back" size={20} color={text} />
        <Text style={[ss.backText, { color: text }]}>{t('common.back')}</Text>
      </TouchableOpacity>
      <Text style={[ss.title, { color: text }]}>{t('profile.settings')}</Text>

      <View style={[ss.card, { backgroundColor: cardBg, borderColor: border }]}>

        {/* Idioma */}
        <TouchableOpacity
          onPress={() => setShowLanguages(v => !v)}
          style={[ss.row, { borderBottomWidth: 1, borderBottomColor: border }]}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Ionicons name="language-outline" size={18} color={muted} />
            <Text style={{ color: text, fontSize: 15, fontWeight: '600' }}>
              {t('profile.settingsOptions.language')}
            </Text>
          </View>
          <Text style={{ color: muted, fontSize: 14 }}>{currentLangLabel}</Text>
        </TouchableOpacity>

        {showLanguages && (
          <View style={{ paddingLeft: 38, paddingVertical: 4 }}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => { changeLanguage(lang.code); setShowLanguages(false); }}
                style={ss.langOption}
              >
                <Text style={{
                  color: i18n.language === lang.code ? theme.primary : text,
                  fontWeight: i18n.language === lang.code ? '700' : '400',
                  fontSize: 14,
                }}>
                  {lang.label}
                </Text>
                {i18n.language === lang.code && (
                  <Ionicons name="checkmark" size={16} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tema */}
        <View style={[ss.row, { borderBottomWidth: 1, borderBottomColor: border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Ionicons name="moon-outline" size={18} color={muted} />
            <Text style={{ color: text, fontSize: 15, fontWeight: '600' }}>
              {t('profile.settingsOptions.theme')}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={changeTheme}
            trackColor={{ false: '#ccc', true: theme.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Notificaciones */}
        <View style={ss.row}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <Ionicons name="notifications-outline" size={18} color={muted} />
            <Text style={{ color: text, fontSize: 15, fontWeight: '600' }}>
              {t('profile.settingsOptions.notifications')}
            </Text>
          </View>
          <Switch
            value={notificationsActive}
            onValueChange={changeNotifications}
            trackColor={{ false: '#ccc', true: theme.primary }}
            thumbColor={Colors.white}
          />
        </View>

      </View>
    </View>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 20 },
  card: { borderRadius: 14, borderWidth: 1, padding: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 10 },
  langOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingRight: 10 },
});