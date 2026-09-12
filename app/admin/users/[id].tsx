// ─────────────────────────────────────────────
//  app/admin/users/[id].tsx
//  RF-10 — Detalle / edición de usuario (datos quemados)
//
//  · Documento: siempre solo lectura
//  · Nombre, apellido, correo: editables con estado local
//  · Guardar: muestra mensaje de éxito, no persiste más allá
// ─────────────────────────────────────────────
import { MockUser, MOCK_PROGRAMS, MOCK_USERS } from '@/features/users/mocks';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function UserDetailScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const { alert, DialogUI } = useAppDialog();
  const { id }            = useLocalSearchParams<{ id: string }>();

  // Busca en MOCK_USERS por id
  const base: MockUser | undefined = MOCK_USERS.find(u => u.id === id);

  // Estado editable local (solo nombre, apellido, correo)
  const [name,     setName]     = useState(base?.name     ?? '');
  const [lastname, setLastname] = useState(base?.lastname ?? '');
  const [email,    setEmail]    = useState(base?.email    ?? '');
  const [emailErr, setEmailErr] = useState('');

  // ── Colores ────────────────────────────────
  const text      = isDark ? Colors.dark.text       : Colors.light.text;
  const muted     = isDark ? Colors.dark.textMuted  : Colors.light.textMuted;
  const bg        = isDark ? Colors.dark.background : Colors.light.background;
  const card      = isDark ? '#0D1F14'              : Colors.white;
  const border    = isDark ? 'rgba(101,179,97,0.18)': 'rgba(101,179,97,0.20)';
  const softGreen = isDark ? 'rgba(101,179,97,0.14)': '#EAF7E8';
  const softBlue  = isDark ? 'rgba(74,144,217,0.16)': '#EAF3FC';
  const softAmber = isDark ? 'rgba(232,155,44,0.16)': '#FFF5DF';

  if (!base) {
    return (
      <View style={[styles.root, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={40} color={muted} />
        <Text style={[styles.notFound, { color: muted }]}>{t('users.errors.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnCenter, { borderColor: border }]}>
          <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isInstructor = base.role === 'INSTRUCTOR';
  const roleColor    = isInstructor ? '#4A90D9' : theme.primary;
  const roleBg       = isInstructor ? softBlue  : softGreen;
  const roleLabel    = isInstructor
    ? t('users.create.roleInstructor')
    : t('users.create.roleApprentice');
  const programLabel = MOCK_PROGRAMS.find(p => p.code === base.programCode)?.label;

  const handleSave = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErr(t('register.errors.emailInvalid'));
      return;
    }
    setEmailErr('');
    alert(t('common.save'), t('users.create.success'), [
      { text: t('common.ok') },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: card, borderColor: border }]}
          >
            <Ionicons name="arrow-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: text }]} numberOfLines={1}>
              {name} {lastname}
            </Text>
            <Text style={[styles.subtitle, { color: muted }]}>{t('users.details')}</Text>
          </View>
        </View>

        {/* Banner de perfil */}
        <View style={[styles.banner, { backgroundColor: roleBg }]}>
          <View style={[styles.bannerAvatar, { backgroundColor: roleColor }]}>
            <Text style={styles.bannerAvatarText}>{base.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerName, { color: text }]}>{name} {lastname}</Text>
            <View style={[styles.rolePill, { backgroundColor: roleColor + '22' }]}>
              <Text style={[styles.rolePillText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          </View>
          {/* estado */}
          <View style={[
            styles.statusPill,
            { backgroundColor: base.status === 'active' ? softGreen : (isDark ? 'rgba(255,255,255,0.06)' : '#F2F2F2') },
          ]}>
            <View style={[styles.statusDot, { backgroundColor: base.status === 'active' ? Colors.success : muted }]} />
            <Text style={[styles.statusText, { color: base.status === 'active' ? Colors.success : muted }]}>
              {base.status === 'active' ? t('users.statuses.ACTIVE') : t('users.statuses.INACTIVE')}
            </Text>
          </View>
        </View>

        {/* ── Información de solo lectura ── */}
        <View style={[styles.card, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.readonlyData')}</Text>

          {/* Documento — siempre deshabilitado */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('users.document')}</Text>
            <View style={[styles.fieldDisabled, { borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5F5F5' }]}>
              <Ionicons name="lock-closed-outline" size={14} color={muted} style={{ marginRight: 6 }} />
              <Text style={[styles.fieldDisabledText, { color: muted }]}>{base.document}</Text>
            </View>
            <Text style={[styles.fieldHint, { color: muted }]}>{t('users.detail.documentReadonly')}</Text>
          </View>

          {/* Rol */}
          <View style={styles.infoRow}>
            <Ionicons name="shield-outline" size={13} color={muted} />
            <Text style={[styles.infoText, { color: muted }]}>
              {t('users.role')}:{' '}
              <Text style={{ color: roleColor, fontWeight: '700' }}>{roleLabel}</Text>
            </Text>
          </View>

          {/* Tipo instructor */}
          {isInstructor && base.instructorType && (
            <View style={styles.infoRow}>
              <Ionicons name="bookmark-outline" size={13} color={muted} />
              <Text style={[styles.infoText, { color: muted }]}>
                {t('users.create.instructorTypeLabel')}:{' '}
                <Text style={{ color: text }}>
                  {base.instructorType === 'especifico'
                    ? t('users.create.instructorTypeSpecific')
                    : t('users.create.instructorTypeTransversal')}
                </Text>
              </Text>
            </View>
          )}

          {/* Programa */}
          {isInstructor && base.programCode && (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={13} color={muted} />
              <Text style={[styles.infoText, { color: muted }]}>
                {t('users.create.programLabel')}:{' '}
                <Text style={{ color: text }}>{base.programCode}{programLabel ? ` · ${programLabel}` : ''}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* ── Datos editables ── */}
        <View style={[styles.card, { backgroundColor: card, borderColor: border, marginTop: 12 }]}>
          <Text style={[styles.section, { color: theme.primary }]}>{t('users.editData')}</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('users.firstName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('users.firstName')}
                  placeholderTextColor={muted}
                  style={[styles.field, { color: text, borderColor: border }]}
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('users.lastName')}</Text>
                <TextInput
                  value={lastname}
                  onChangeText={setLastname}
                  placeholder={t('users.lastName')}
                  placeholderTextColor={muted}
                  style={[styles.field, { color: text, borderColor: border }]}
                />
              </View>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t('register.email')}</Text>
            <TextInput
              value={email}
              onChangeText={v => { setEmail(v); setEmailErr(''); }}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.field, { color: text, borderColor: emailErr ? Colors.error : border }]}
            />
            {emailErr ? <Text style={styles.fieldError}>{emailErr}</Text> : null}
          </View>

          {/* Nota estado (solo visual) */}
          <View style={[styles.note, { backgroundColor: softAmber, borderColor: Colors.warning + '40' }]}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.warning} />
            <Text style={[styles.noteText, { color: Colors.warning }]}>
              {t('users.sessionNote')}
            </Text>
          </View>

          {/* Acciones */}
          <View style={styles.formActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={{ color: muted, fontWeight: '600' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="save-outline" size={16} color={Colors.white} />
              <Text style={styles.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {DialogUI}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { padding: 18, paddingBottom: 40 },

  notFound:      { fontSize: FontSize.md, marginTop: 12 },
  backBtnCenter: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, marginTop: 16 },

  header:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingBottom: 16 },
  backBtn:  { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: FontSize['2xl'], fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 3 },

  banner:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 12 },
  bannerAvatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bannerAvatarText: { color: Colors.white, fontWeight: '900', fontSize: 18 },
  bannerName:   { fontSize: 15, fontWeight: '800' },
  rolePill:     { flexDirection: 'row', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, marginTop: 4, alignSelf: 'flex-start' },
  rolePillText: { fontSize: FontSize.xs, fontWeight: '800' },
  statusPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  statusText:   { fontSize: 9, fontWeight: '800' },

  card:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  section: { fontSize: FontSize.xs, fontWeight: '900', textTransform: 'uppercase' },

  fieldGroup:       { gap: 5 },
  fieldLabel:       { fontSize: FontSize.xs, fontWeight: '800', textTransform: 'uppercase' },
  fieldDisabled:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  fieldDisabledText:{ fontSize: 14, flex: 1 },
  fieldHint:        { fontSize: FontSize.xs, marginTop: 3 },
  field: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  fieldError: { color: Colors.error, fontSize: FontSize.xs, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },

  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { fontSize: FontSize.sm },

  note:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 10 },
  noteText: { flex: 1, fontSize: FontSize.xs, lineHeight: 16 },

  formActions:  { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 4 },
  cancelBtn:    { paddingHorizontal: 8, paddingVertical: 11 },
  saveBtn:      { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  saveBtnText:  { color: Colors.white, fontWeight: '800', fontSize: FontSize.sm },
});
