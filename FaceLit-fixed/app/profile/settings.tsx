// ─────────────────────────────────────────────
//  app/profile/settings.tsx
// ─────────────────────────────────────────────
import { useUserSettings } from '@/features/profile/useUserSettings';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

export default function SettingsScreen() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const {
    loading, saving, saved, draft,
    loadAndApply,
    setDraftTheme, setDraftLanguage, setDraftNotifications, saveChanges,
  } = useUserSettings();

  const [showLanguages, setShowLanguages] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';
  const rowBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const iconBg = isDark ? 'rgba(101,179,97,0.14)' : 'rgba(101,179,97,0.10)';
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const currentLangLabel = LANGUAGES.find(l => l.code === draft.language)?.label ?? 'Español';

  useEffect(() => {
    loadAndApply();
  }, []);

  const handleSave = async () => {
    const result = await saveChanges();
    if (result.success) {
      alert('✓', t('profile.settingsOptions.saved') ?? 'Cambios guardados');
    } else {
      alert(t('common.error'), result.error);
    }
  };

  if (loading) {
    return (
      <View style={[ss.safe, { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[ss.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => router.back()} style={ss.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[ss.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* ── Encabezado ── */}
        <View style={[ss.headerCard, { backgroundColor: isDark ? '#0D1F14' : '#F0FFF0', borderColor: border }]}>
          <View style={ss.headerDeco} />
          <View style={[ss.headerIconWrap, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="options-outline" size={28} color={theme.primary} />
          </View>
          <Text style={[ss.headerTitle, { color: text }]}>{t('profile.settings')}</Text>
          <Text style={[ss.headerSubtitle, { color: muted }]}>
            {t('profile.settingsOptions.subtitle') ?? 'Personaliza tu experiencia en la app'}
          </Text>
        </View>

        {/* ── Sección: Preferencias ── */}
        <View style={ss.sectionHeader}>
          <View style={[ss.sectionIconWrap, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="color-palette-outline" size={14} color={theme.primary} />
          </View>
          <Text style={[ss.sectionTitle, { color: text }]}>
            {t('profile.settingsOptions.preferences') ?? 'Preferencias'}
          </Text>
        </View>

        <View style={[ss.card, { backgroundColor: cardBg, borderColor: border }]}>

          {/* Idioma */}
          <TouchableOpacity
            onPress={() => setShowLanguages(v => !v)}
            style={[ss.row, { borderBottomWidth: 1, borderBottomColor: rowBorder }]}
            activeOpacity={0.7}
          >
            <View style={ss.rowLeft}>
              <View style={[ss.rowIconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name="language-outline" size={17} color={theme.primary} />
              </View>
              <Text style={[ss.rowLabel, { color: text }]}>
                {t('profile.settingsOptions.language')}
              </Text>
            </View>
            <View style={ss.rowRight}>
              <Text style={{ color: muted, fontSize: 14, fontWeight: '600' }}>{currentLangLabel}</Text>
              <Ionicons name={showLanguages ? 'chevron-up' : 'chevron-down'} size={16} color={muted} />
            </View>
          </TouchableOpacity>

          {showLanguages && (
            <View style={[ss.langBox, { borderBottomWidth: 1, borderBottomColor: rowBorder }]}>
              {LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.code}
                  onPress={() => { setDraftLanguage(lang.code); setShowLanguages(false); }}
                  style={[
                    ss.langOption,
                    draft.language === lang.code && { backgroundColor: theme.primary + '14' },
                  ]}
                >
                  <Text style={{
                    color: draft.language === lang.code ? theme.primary : text,
                    fontWeight: draft.language === lang.code ? '700' : '500',
                    fontSize: 14,
                  }}>
                    {lang.label}
                  </Text>
                  {draft.language === lang.code && (
                    <Ionicons name="checkmark-circle" size={17} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tema */}
          <View style={[ss.row, { borderBottomWidth: 1, borderBottomColor: rowBorder }]}>
            <View style={ss.rowLeft}>
              <View style={[ss.rowIconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name="moon-outline" size={17} color={theme.primary} />
              </View>
              <Text style={[ss.rowLabel, { color: text }]}>
                {t('profile.settingsOptions.theme')}
              </Text>
            </View>
            <Switch
              value={draft.darkMode}
              onValueChange={setDraftTheme}
              trackColor={{ false: '#ccc', true: theme.primary }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Notificaciones */}
          <View style={ss.row}>
            <View style={ss.rowLeft}>
              <View style={[ss.rowIconWrap, { backgroundColor: iconBg }]}>
                <Ionicons name="notifications-outline" size={17} color={theme.primary} />
              </View>
              <Text style={[ss.rowLabel, { color: text }]}>
                {t('profile.settingsOptions.notifications')}
              </Text>
            </View>
            <Switch
              value={draft.notificationsActive}
              onValueChange={setDraftNotifications}
              trackColor={{ false: '#ccc', true: theme.primary }}
              thumbColor={Colors.white}
            />
          </View>

        </View>

        {/* ── Botón Guardar ── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saved || saving}
          style={[
            ss.saveBtn,
            saved || saving
              ? { backgroundColor: isDark ? 'rgba(101,179,97,0.15)' : 'rgba(101,179,97,0.12)' }
              : { backgroundColor: theme.primary },
          ]}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={saved ? theme.primary : Colors.white} />
          ) : (
            <>
              <Ionicons
                name={saved ? 'checkmark-circle-outline' : 'save-outline'}
                size={19}
                color={saved ? theme.primary : Colors.white}
              />
              <Text style={[ss.saveBtnText, { color: saved ? theme.primary : Colors.white }]}>
                {saved ? (t('profile.settingsOptions.saved') ?? 'Guardado') : (t('profile.settingsOptions.saveChanges') ?? 'Guardar cambios')}
              </Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      {DialogUI}
    </View>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },

  headerCard: {
    borderRadius: 22, borderWidth: 1, alignItems: 'center',
    paddingVertical: 28, paddingHorizontal: 20, marginBottom: 24,
    overflow: 'hidden',
  },
  headerDeco: {
    position: 'absolute', top: -60, left: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(101,179,97,0.08)',
  },
  headerIconWrap: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, marginBottom: 6, textAlign: 'center' },
  headerSubtitle: { fontSize: FontSize.sm, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.black },

  card: { borderRadius: 18, borderWidth: 1, padding: 6, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600' },

  langBox: { paddingLeft: 48, paddingVertical: 4 },
  langOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, marginVertical: 1, marginRight: 8,
  },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15,
  },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});