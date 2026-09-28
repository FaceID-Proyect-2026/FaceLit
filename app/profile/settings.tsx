// ─────────────────────────────────────────────
//  app/profile/settings.tsx
// ─────────────────────────────────────────────
import { useUserSettings } from '@/features/profile/useUserSettings';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth, type UserRole } from '@/shared/contexts/AuthContext';
import type { Language } from '@/shared/contexts/I18nContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
];

function getAccessRights(role?: UserRole | null) {
  if (role === 'INSTRUCTOR') {
    return {
      label: 'Instructor',
      summary: 'Puede consultar y gestionar la asistencia solo de las fichas que tiene asignadas.',
      rights: [
        'Consultar sus propios datos registrados.',
        'Visualizar asistencias de sus fichas asignadas.',
        'Consultar solo fichas y aprendices autorizados.',
        'Registrar o gestionar asistencia de las fichas correspondientes.',
      ],
      restriction: 'No puede modificar directamente datos personales de usuarios.',
    };
  }

  if (role === 'APPRENTICE') {
    return {
      label: 'Aprendiz',
      summary: 'Puede consultar su informacion personal, academica y sus propias asistencias.',
      rights: [
        'Consultar sus propios datos registrados.',
        'Visualizar sus propias asistencias.',
        'Consultar solo la informacion academica que le corresponda.',
        'Solicitar al Coordinador la correccion o actualizacion de sus datos.',
      ],
      restriction: 'No puede modificar directamente sus datos personales registrados.',
    };
  }

  return {
    label: role === 'COORDINATOR_REGISTER' ? 'Coordinador de registro' : 'Coordinador',
    summary: 'Puede gestionar usuarios, roles, fichas y datos administrativos segun sus permisos.',
    rights: [
      'Consultar informacion de usuarios para gestion administrativa.',
      'Crear, actualizar, activar o desactivar usuarios.',
      'Actualizar o corregir datos personales de usuarios.',
      'Gestionar aprendices, instructores y fichas.',
      'Asignar roles y gestionar relaciones Instructor-Ficha.',
    ],
    restriction: 'Las modificaciones relevantes deben quedar registradas para trazabilidad.',
  };
}

export default function SettingsScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const {
    saving, saved, draft,
    loadAndApply,
    setDraftTheme, setDraftLanguage, setDraftNotifications, saveChanges,
  } = useUserSettings();

  const [showLanguages, setShowLanguages] = useState(false);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = theme.surface;
  const border = theme.border;
  const rowBorder = theme.border;
  const iconBg = theme.primaryFaint;
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  const currentLangLabel = LANGUAGES.find(l => l.code === draft.language)?.label ?? 'Español';
  const accessRights = getAccessRights(user?.role);

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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(Routes.PROFILE.VIEW as any);
  };

  return (
    <View style={[ss.safe, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={[ss.scroll, { paddingTop: Math.max(insets.top, 14) + 14 }]} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={handleBack} style={ss.backBtn}>
          <Ionicons name="arrow-back" size={20} color={text} />
          <Text style={[ss.backText, { color: text }]}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* ── Encabezado ── */}
        <View style={[ss.headerCard, { backgroundColor: theme.surface, borderColor: border }]}>
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
        <View style={ss.sectionHeader}>
          <View style={[ss.sectionIconWrap, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={theme.primary} />
          </View>
          <Text style={[ss.sectionTitle, { color: text }]}>Derechos de acceso</Text>
        </View>

        <View style={[ss.accessCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={ss.accessHeader}>
            <View style={[ss.accessIconWrap, { backgroundColor: theme.primary + '18' }]}>
              <Ionicons name="key-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ss.accessTitle, { color: text }]}>{accessRights.label}</Text>
              <Text style={[ss.accessSummary, { color: muted }]}>{accessRights.summary}</Text>
            </View>
          </View>

          <View style={ss.accessList}>
            {accessRights.rights.map((right) => (
              <View key={right} style={ss.accessItem}>
                <Ionicons name="checkmark-circle-outline" size={17} color={theme.primary} />
                <Text style={[ss.accessText, { color: text }]}>{right}</Text>
              </View>
            ))}
          </View>

          <View style={[ss.restrictionBox, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
            <Ionicons name="lock-closed-outline" size={17} color={theme.primary} />
            <Text style={[ss.restrictionText, { color: muted }]}>{accessRights.restriction}</Text>
          </View>
        </View>

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
  accessCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20 },
  accessHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  accessIconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accessTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.black },
  accessSummary: { fontSize: FontSize.sm, marginTop: 3, lineHeight: 18 },
  accessList: { gap: 10 },
  accessItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  accessText: { flex: 1, fontSize: FontSize.sm, lineHeight: 19, fontWeight: '600' },
  restrictionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 14 },
  restrictionText: { flex: 1, fontSize: FontSize.sm, lineHeight: 18, fontWeight: '600' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 15,
  },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
