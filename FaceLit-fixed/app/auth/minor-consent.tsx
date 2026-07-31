// ─────────────────────────────────────────────
//  app/auth/minor-consent.tsx
//  Solo VISTA — toda la lógica de negocio vive en
//  features/auth/hooks/useMinorConsentForm.ts
// ─────────────────────────────────────────────
import { useMinorConsentForm } from '@/features/auth/hooks/useMinorConsentForm';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARD_MAX  = 900;

export default function MinorConsentScreen() {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();
  const { minorEmail }    = useLocalSearchParams<{ minorEmail?: string }>();
  const { width }         = useWindowDimensions();
  const isWide            = width >= 700;

  // ── Toda la lógica de negocio viene del hook ──
  const {
    form, emailValidated, accepted, errors,
    handleName, handleDoc, handleEmail, handleEmailValidate,
    setAccepted, handleSubmit, handleBack,
  } = useMinorConsentForm({ minorEmail });

  // ── Estado puramente de UI (no es lógica de negocio) ──
  const [focused, setFocused] = useState<string | null>(null);

  // ── Colores locales (presentación) ─────────────
  const text            = isDark ? '#FFFFFF'                : '#111111';
  const muted           = isDark ? '#A8BCA6'                : '#555555';
  const cardBg          = isDark ? '#07120D'                : '#FFFFFF';
  const inputBg         = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder     = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const activeBorder    = theme.primary;
  const linkColor       = isDark ? '#8EF58A'                : '#3A8C36';
  const errorColor      = '#D92027';
  const cardBorder      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const legalBg         = isDark ? 'rgba(200,130,74,0.15)'  : '#FFF3E0';
  const legalBorder     = '#C8824A';
  const checkCardBg     = isDark ? 'rgba(255,255,255,0.04)' : '#F3F8F3';
  const checkCardBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';

  // ── Bloques JSX (solo vista) ───────────────────
  const fieldName = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('minorConsent.nameLabel')}</Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.guardianName ? errorColor : focused === 'name' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="person-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.name}
          onChangeText={handleName}
          placeholder={t('minorConsent.namePlaceholder')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused('name')}
          onBlur={() => setFocused(null)}
        />
      </View>
      {errors.guardianName ? <Text style={s.errorText}>{errors.guardianName}</Text> : null}
    </View>
  );

  const fieldDoc = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('minorConsent.docLabel')}</Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.guardianDoc ? errorColor : focused === 'doc' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="document-text-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.document}
          onChangeText={handleDoc}
          placeholder={t('minorConsent.docPlaceholder')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused('doc')}
          onBlur={() => setFocused(null)}
        />
        <Text style={[s.docCounter, { color: form.document.length === 10 ? theme.primary : muted }]}>
          {form.document.length}/10
        </Text>
      </View>
      {errors.guardianDoc ? <Text style={s.errorText}>{errors.guardianDoc}</Text> : null}
    </View>
  );

  const fieldEmail = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('minorConsent.emailLabel')}</Text>
      {minorEmail && (
        <View style={[s.infoBox, { backgroundColor: isDark ? 'rgba(255,165,0,0.08)' : '#FFF8E7', borderColor: '#FAA61A' }]}>
          <Ionicons name="warning-outline" size={13} color="#FAA61A" />
          <Text style={[s.infoText, { color: isDark ? '#FAA61A' : '#8B6000' }]}>
            {t('minorConsent.emailWarning')}{minorEmail}
          </Text>
        </View>
      )}
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.guardianEmail ? errorColor : focused === 'email' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="mail-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.email}
          onChangeText={handleEmail}
          placeholder={t('minorConsent.emailPlaceholder')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
        />
        {emailValidated && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
      </View>
      {errors.guardianEmail ? <Text style={s.errorText}>{errors.guardianEmail}</Text> : null}
    </View>
  );

  const validateEmailBtn = (
    <>
      <TouchableOpacity
        onPress={handleEmailValidate}
        style={[s.validateBtn, {
          borderColor:     emailValidated ? theme.primary : errors.emailAction ? errorColor : inputBorder,
          backgroundColor: emailValidated ? theme.primary + '18' : 'transparent',
        }]}
      >
        <Ionicons
          name={emailValidated ? 'checkmark-circle-outline' : 'send-outline'}
          size={16}
          color={emailValidated ? theme.primary : errors.emailAction ? errorColor : muted}
        />
        <Text style={[s.validateBtnText, { color: emailValidated ? theme.primary : errors.emailAction ? errorColor : muted }]}>
          {emailValidated ? t('minorConsent.validateBtnDone') : t('minorConsent.validateBtn')}
        </Text>
      </TouchableOpacity>
      {errors.emailAction ? <Text style={[s.errorText, { marginBottom: 6 }]}>{errors.emailAction}</Text> : null}
    </>
  );

  // ── Render ────────────────────────────────────
  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#06170F', '#0B2D17'] : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <View style={s.arcTop} />
      <View style={s.arcBottom} />

      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[s.card, isWide && s.cardWide, { backgroundColor: cardBg, borderColor: cardBorder }]}>

              {/* ── Cabecera ── */}
              <View style={s.iconWrap}>
                <LinearGradient colors={['#FFB74D', '#F57C00']} style={s.iconCircle}>
                  <Ionicons name="alert" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <Text style={[s.title, { color: text }]}>
                {t('minorConsent.title')}
              </Text>

              <Text style={[s.subtitle, { color: muted }]}>
                {t('minorConsent.subtitle1')}
                <Text style={{ color: '#FAA61A', fontWeight: '700' }}>
                  {t('minorConsent.minorLabel')}
                </Text>
                {t('minorConsent.subtitle2')}
              </Text>

              {/* Aviso legal */}
              <View style={[s.legalBox, { backgroundColor: legalBg, borderColor: legalBorder }]}>
                <Ionicons name="document-text-outline" size={18} color="#C8824A" style={{ marginBottom: 6 }} />
                <Text style={[s.legalText, { color: isDark ? '#FFB74D' : '#7B4A10' }]}>
                  {t('minorConsent.legalText')}
                  <Text style={{ fontWeight: '800' }}>{t('minorConsent.lawLabel')}</Text>
                  {t('minorConsent.legalText2')}
                </Text>
              </View>

              {/* ── Sección: datos del acudiente ── */}
              <View style={[s.sectionHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <Ionicons name="person-outline" size={13} color={theme.primary} />
                <Text style={[s.sectionTitle, { color: theme.primary }]}>
                  {t('minorConsent.sectionGuardian')}
                </Text>
              </View>

              {/* ── Grid 2 columnas (wide) ó 1 columna (móvil) ── */}
              {isWide ? (
                <>
                  <View style={s.row}>
                    <View style={s.col}>{fieldName}</View>
                    <View style={s.col}>{fieldDoc}</View>
                  </View>
                  {fieldEmail}
                  {validateEmailBtn}
                </>
              ) : (
                <>
                  {fieldName}
                  {fieldDoc}
                  {fieldEmail}
                  {validateEmailBtn}
                </>
              )}

              {/* ── Sección: autorización ── */}
              <View style={[s.sectionHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <Ionicons name="checkmark-done-outline" size={13} color={theme.primary} />
                <Text style={[s.sectionTitle, { color: theme.primary }]}>
                  {t('minorConsent.sectionAuthorization')}
                </Text>
              </View>

              {/* Checkbox */}
              <View style={[s.consentCard, { backgroundColor: checkCardBg, borderColor: checkCardBorder }]}>
                <TouchableOpacity onPress={() => setAccepted(!accepted)} activeOpacity={0.8} style={s.checkRow}>
                  <View style={[s.checkbox, {
                    borderColor:     errors.consent ? errorColor : accepted ? theme.primary : inputBorder,
                    backgroundColor: accepted ? theme.primary : 'transparent',
                  }]}>
                    {accepted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={[s.checkLabel, { color: text }]}>
                    {t('minorConsent.consentText')}
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>
                      {t('minorConsent.lawLabel')}
                    </Text>
                    {t('minorConsent.consentText2')}
                  </Text>
                </TouchableOpacity>
                {errors.consent ? <Text style={[s.errorText, { marginTop: 6 }]}>{errors.consent}</Text> : null}

                <TouchableOpacity
                  onPress={() => Linking.openURL('https://share.google/KHen3qRj2g5sVHCCw')}
                  style={[s.moreInfoBtn, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
                >
                  <Ionicons name="open-outline" size={14} color={linkColor} />
                  <Text style={[s.moreInfoText, { color: linkColor }]}>
                    {t('minorConsent.moreInfo')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Botones de acción ── */}
              <View style={isWide ? s.actionsRow : s.actionsCol}>
                <TouchableOpacity
                  onPress={handleBack}
                  activeOpacity={0.8}
                  style={[s.backBtn, isWide && s.actionBtnWide, { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }]}
                >
                  <Ionicons name="arrow-back-outline" size={16} color={muted} />
                  <Text style={[s.backBtnText, { color: muted }]}>{t('minorConsent.backBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSubmit} style={[s.confirmBtn, isWide && s.actionBtnWide]}>
                  <LinearGradient
                    colors={['#72C96D', '#65B361', '#4FA14B']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.confirmBtnGradient}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                    <Text style={s.confirmBtnText}>{t('minorConsent.confirmBtn')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Estilos (solo presentación) ────────────────
const s = StyleSheet.create({
  gradient:  { flex: 1 },
  safe:      { flex: 1 },
  kav:       { flex: 1 },
  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200, backgroundColor: 'rgba(20,70,28,0.18)' },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120,  bottom: -30, borderRadius: 180, backgroundColor: 'rgba(101,179,97,0.28)' },
  scroll:    { flexGrow: 1, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },

  card: {
    width: '100%',
    maxWidth: CARD_MAX,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 30,
  },
  cardWide: { paddingHorizontal: 28 },

  iconWrap:   { alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#F57C00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },

  title:    { fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  legalBox:  { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 6, alignItems: 'center' },
  legalText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1 },
  sectionTitle:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1, flexShrink: 1 },

  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },

  fieldGroup: { marginBottom: 12 },
  label:      { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputWrap:  { minHeight: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input:      { flex: 1, fontSize: 15, outlineStyle: 'none' } as any,
  errorText:  { color: '#D92027', fontSize: 11, marginTop: 3 },
  docCounter: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },

  infoBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  infoText: { fontSize: 12, flex: 1, flexShrink: 1, lineHeight: 17, wordBreak: 'break-word' } as any,

  validateBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 10, borderWidth: 1.2, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 10 },
  validateBtnText: { fontSize: 13, fontWeight: '700', textAlign: 'center', flexShrink: 1 },

  consentCard:  { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 6, marginBottom: 4 },
  checkRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox:     { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  checkLabel:   { flex: 1, fontSize: 13, lineHeight: 20 },
  moreInfoBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  moreInfoText: { fontSize: 12, fontWeight: '600', flex: 1, flexShrink: 1 },

  actionsRow:    { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 24, marginBottom: 8 },
  actionsCol:    { flexDirection: 'column', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  actionBtnWide: { flex: 1, maxWidth: undefined, alignSelf: undefined, width: undefined },

  confirmBtn:         { width: '100%', maxWidth: 300, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  confirmBtnGradient: { paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  confirmBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  backBtn:            { width: '100%', maxWidth: 300, alignSelf: 'center', borderRadius: 16, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  backBtnText:        { fontSize: 15, fontWeight: '600' },
});
