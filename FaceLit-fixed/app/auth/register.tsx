// ─────────────────────────────────────────────
//  app/auth/register.tsx  — layout ref: minor-consent.tsx
// ─────────────────────────────────────────────
import NavLink from '@/features/auth/components/NavLink';
import { Routes } from '@/shared/constants/routes';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Constantes ────────────────────────────────
const { width } = Dimensions.get('window');
const CARD_MAX = 960;

const ONLY_LETTERS   = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/;
const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>?/\\|`~]).{8,15}$/;

const IDENTITY_VALUES = ['TI', 'CC', 'CE', 'PA'] as const;

const initialForm = {
  name: '', lastname: '', identityType: '',
  document: '', email: '', password: '',
};

const initialErrors: Record<string, string> = {
  name: '', lastname: '', identityType: '', document: '',
  email: '', emailAction: '', password: '', confirmPassword: '',
  birthdate: '', policy: '', rights: '',
};

// ── Helpers ───────────────────────────────────
function getAge(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function liveValidate(key: string, value: string, t: (k: string) => string): string {
  switch (key) {
    case 'name':
    case 'lastname':
      if (!value) return '';
      if (!ONLY_LETTERS.test(value)) return t('register.errors.onlyLetters');
      return value.length >= 2 ? '✓' : '';
    case 'document':
      if (!value) return '';
      if (value.length < 10) return t('register.errors.documentLength');
      return '✓';
    case 'email':
      if (!value) return '';
      if (!EMAIL_REGEX.test(value)) return t('register.errors.emailInvalid');
      return '✓';
    case 'password':
      if (!value) return '';
      if (!PASSWORD_REGEX.test(value)) return t('register.errors.passwordWeak');
      return '✓';
    default:
      return '';
  }
}

// ── Modal: Derechos ───────────────────────────
function RightsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();

  const RIGHTS = [
    { icon: 'eye-outline'              as const, title: t('rights.items.access.title'),        desc: t('rights.items.access.desc') },
    { icon: 'create-outline'           as const, title: t('rights.items.update.title'),        desc: t('rights.items.update.desc') },
    { icon: 'shield-checkmark-outline' as const, title: t('rights.items.rectification.title'), desc: t('rights.items.rectification.desc') },
    { icon: 'trash-outline'            as const, title: t('rights.items.deletion.title'),      desc: t('rights.items.deletion.desc') },
    { icon: 'ban-outline'              as const, title: t('rights.items.revocation.title'),    desc: t('rights.items.revocation.desc') },
  ];

  const text        = isDark ? '#FFFFFF' : '#111111';
  const muted       = isDark ? '#A8BCA6' : '#555555';
  const cardBg      = isDark ? '#07120D' : '#FFFFFF';
  const itemBg      = isDark ? 'rgba(255,255,255,0.04)' : '#F6FBF6';
  const itemBorder  = isDark ? 'rgba(101,179,97,0.18)'  : 'rgba(101,179,97,0.20)';
  const importantBg = isDark ? 'rgba(101,179,97,0.12)'  : 'rgba(101,179,97,0.10)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={rm.overlay}>
        <View style={[rm.card, { backgroundColor: cardBg }]}>

          {/* Cerrar */}
          <TouchableOpacity
            onPress={onClose}
            style={[rm.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={muted} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Ícono */}
            <View style={rm.iconWrap}>
              <LinearGradient colors={['#7DD87A', '#65B361', '#4A9146']} style={rm.iconCircle}>
                <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Título */}
            <Text style={[rm.title, { color: text }]}>
              {t('rights.title1')}{'\n'}
              <Text style={{ color: theme.primary }}>{t('rights.title2')}</Text>
            </Text>

            {/* Subtítulo */}
            <Text style={[rm.subtitle, { color: muted }]}>
              {t('rights.subtitle')}{' '}
              <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('rights.lawLabel')}</Text>
            </Text>

            {/* Separador */}
            <View style={[rm.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]} />

            {/* Lista de derechos */}
            {RIGHTS.map((r, i) => (
              <View key={i} style={[rm.rightItem, { backgroundColor: itemBg, borderColor: itemBorder }]}>
                <View style={[rm.rightIconWrap, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name={r.icon} size={18} color={theme.primary} />
                </View>
                <View style={rm.rightContent}>
                  <Text style={[rm.rightTitle, { color: theme.primary }]}>{r.title}</Text>
                  <Text style={[rm.rightDesc,  { color: muted }]}>{r.desc}</Text>
                </View>
              </View>
            ))}

            {/* Caja importante */}
            <View style={[rm.importantBox, { backgroundColor: importantBg, borderColor: theme.primary + '40' }]}>
              <Ionicons name="information-circle-outline" size={18} color={theme.primary} style={{ marginBottom: 6 }} />
              <Text style={[rm.importantText, { color: text }]}>
                <Text style={[rm.importantBold, { color: theme.primary }]}>{t('rights.importantLabel')}</Text>
                {t('rights.importantText')}
              </Text>
            </View>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    width: '100%', maxWidth: 480, borderRadius: 26,
    paddingHorizontal: 24, paddingVertical: 28,
    maxHeight: '90%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  closeBtn: {
    alignSelf: 'flex-end', width: 34, height: 34,
    borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  iconWrap:   { alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#65B361', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  title:    { fontSize: 22, fontWeight: '900', textAlign: 'center', lineHeight: 30, marginBottom: 8 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  divider:  { height: 1, marginBottom: 20 },
  rightItem:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  rightIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rightContent:  { flex: 1 },
  rightTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rightDesc:     { fontSize: 13, lineHeight: 19 },
  importantBox:  { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 10, marginBottom: 8, alignItems: 'center' },
  importantText: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  importantBold: { fontWeight: '800' },
});

// ── Componente principal ──────────────────────
export default function RegisterScreen() {
  const { t }             = useTranslation();
  const { theme, isDark } = useTheme();
  const { validatedEmail } = useLocalSearchParams<{ validatedEmail?: string }>();

  const text         = isDark ? '#FFFFFF'                : '#111111';
  const muted        = isDark ? '#A8BCA6'                : '#555555';
  const cardBg       = isDark ? '#07120D'                : '#FFFFFF';
  const inputBg      = isDark ? 'rgba(255,255,255,0.05)' : '#FAFAFA';
  const inputBorder  = isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB';
  const activeBorder = theme.primary;
  const linkColor    = isDark ? '#8EF58A'                : '#3A8C36';
  const errorColor   = '#D92027';
  const cardBorder   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const checkCardBg  = isDark ? 'rgba(255,255,255,0.04)' : '#F3F8F3';
  const checkCardBdr = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const dropBg       = isDark ? '#0D1F14'                : '#FFFFFF';

  const isWide = width >= 768;

  const identityOptions = IDENTITY_VALUES.map(value => ({
    value,
    label: t(`register.identity${value}`),
  }));

  const [form, setForm]                     = useState({ ...initialForm, email: validatedEmail ?? '' });
  const [birthdate, setBirthdate]           = useState<Date | null>(null);
  const [showPicker, setShowPicker]         = useState(false);
  const [accepted, setAccepted]             = useState(false);
  const [hasRights, setHasRights]           = useState<boolean | null>(null);
  const [emailValidated, setEmailValidated] = useState(!!validatedEmail);
  const [showIdentity, setShowIdentity]     = useState(false);
  const [errors, setErrors]                 = useState(initialErrors);
  const [hints, setHints]                   = useState<Record<string, string>>({});
  const [showPassword, setShowPassword]         = useState(false);
  // ── NUEVO: estado para confirmar contraseña ──
  const [confirmPassword, setConfirmPassword]       = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // ────────────────────────────────────────────
  const [focused, setFocused]               = useState<string | null>(null);
  const [showRights, setShowRights]         = useState(false);

  const clearError = (k: string) => setErrors(p => ({ ...p, [k]: '' }));

  const setField = (key: string, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
    clearError(key);
    setHints(p => ({ ...p, [key]: liveValidate(key, value, t) }));
  };

  const handleEmail = (v: string) => {
    const val = v.replace(/\s/g, '');
    setForm(p => ({ ...p, email: val }));
    setEmailValidated(false);
    clearError('email');
    clearError('emailAction');
    setHints(p => ({ ...p, email: liveValidate('email', val, t) }));
  };

  const handleIdentity = (value: string) => {
    setForm(p => ({ ...p, identityType: value }));
    setShowIdentity(false);
    clearError('identityType');
  };

  const handleEmailValidate = () => {
    const e = form.email.trim();
    if (!e) {
      setErrors(p => ({ ...p, emailAction: t('register.errors.emailEmpty') }));
      return;
    }
    if (!EMAIL_REGEX.test(e)) {
      setErrors(p => ({ ...p, emailAction: t('register.errors.emailInvalidShort') }));
      return;
    }
    router.push({
      pathname: Routes.AUTH.EMAIL_VALIDATION as any,
      params: { email: e },
    });
  };

  const handleRegister = () => {
    const e = { ...initialErrors };
    const d = { ...form, name: form.name.trim(), lastname: form.lastname.trim(), email: form.email.trim() };

    if (!d.name)                         e.name = t('register.errors.nameRequired');
    else if (!ONLY_LETTERS.test(d.name)) e.name = t('register.errors.onlyLetters');

    if (!d.lastname)                           e.lastname = t('register.errors.lastnameRequired');
    else if (!ONLY_LETTERS.test(d.lastname))   e.lastname = t('register.errors.onlyLetters');

    if (!d.identityType) e.identityType = t('register.errors.identityRequired');

    if (!d.document)                   e.document = t('register.errors.documentRequired');
    else if (d.document.length !== 10) e.document = t('register.errors.documentLength');

    if (!d.email)                        e.email = t('register.errors.emailRequired');
    else if (!EMAIL_REGEX.test(d.email)) e.email = t('register.errors.emailInvalid');

    if (!emailValidated) e.emailAction = t('register.errors.emailNotValidated');

    if (!d.password)                           e.password = t('register.errors.passwordRequired');
    else if (!PASSWORD_REGEX.test(d.password)) e.password = t('register.errors.passwordWeak');

    // ── NUEVO: validación confirmar contraseña ──
    if (!confirmPassword) {
      e.confirmPassword = t('register.errors.confirmPasswordRequired') ?? 'Confirma tu contraseña';
    } else if (confirmPassword !== d.password) {
      e.confirmPassword = t('register.errors.passwordMismatch') ?? 'Las contraseñas no coinciden';
    }
    // ───────────────────────────────────────────

    if (!birthdate) {
      e.birthdate = t('register.errors.birthdateRequired');
    } else {
      const age = getAge(birthdate);
      if (age < 8)                                    e.birthdate    = t('register.errors.ageMin');
      else if (age > 100)                             e.birthdate    = t('register.errors.ageMax');
      else if (d.identityType === 'TI' && age >= 18) e.identityType = t('register.errors.tiAdult');
      else if (d.identityType === 'CC' && age < 18)  e.identityType = t('register.errors.ccMinor');
    }

    if (!accepted)          e.policy = t('register.errors.policyRequired');
    if (hasRights === null) e.rights = t('register.errors.rightsRequired');

    setErrors(e);
    if (Object.values(e).some(v => v !== '')) return;

    const age = getAge(birthdate!);
    if (age >= 18) {
      router.push(Routes.AUTH.TEENAGER_REGISTRATION as any);
    } else {
      router.push({ pathname: Routes.AUTH.MINOR_CONSENT as any, params: { minorEmail: d.email } });
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setBirthdate(null);
    router.replace(Routes.AUTH.LOGIN as any);
  };

  const hintColor = (key: string) => hints[key] === '✓' ? theme.primary : errorColor;

  // ── Bloques JSX ──────────────────────────────
  const fieldName = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('register.name')}</Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.name ? errorColor : focused === 'name' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="person-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.name}
          onChangeText={v => setField('name', v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, ''))}
          placeholder={t('register.namePlaceholder')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setFocused('name')}
          onBlur={() => setFocused(null)}
        />
      </View>
      {errors.name ? <Text style={s.errorText}>{errors.name}</Text>
        : hints.name ? <Text style={[s.hintText, { color: hintColor('name') }]}>{hints.name}</Text>
        : null}
    </View>
  );

  const fieldLastname = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('register.lastname')}</Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.lastname ? errorColor : focused === 'lastname' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="people-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.lastname}
          onChangeText={v => setField('lastname', v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, ''))}
          placeholder={t('register.lastnamePlaceholder')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setFocused('lastname')}
          onBlur={() => setFocused(null)}
        />
      </View>
      {errors.lastname ? <Text style={s.errorText}>{errors.lastname}</Text>
        : hints.lastname ? <Text style={[s.hintText, { color: hintColor('lastname') }]}>{hints.lastname}</Text>
        : null}
    </View>
  );

  const fieldIdentity = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('register.identityType')}</Text>
      <TouchableOpacity
        onPress={() => setShowIdentity(!showIdentity)}
        style={[s.inputWrap, {
          backgroundColor: inputBg,
          borderColor: errors.identityType ? errorColor : showIdentity ? activeBorder : inputBorder,
        }]}
      >
        <Ionicons name="card-outline" size={18} color={muted} />
        <Text style={[s.input, { color: form.identityType ? text : (isDark ? '#5A7258' : '#AAAAAA') }]}>
          {form.identityType
            ? identityOptions.find(o => o.value === form.identityType)?.label
            : t('register.identitySelect')}
        </Text>
        <Ionicons name={showIdentity ? 'chevron-up' : 'chevron-down'} size={16} color={muted} />
      </TouchableOpacity>
      {showIdentity && (
        <View style={[s.dropdown, { backgroundColor: dropBg, borderColor: inputBorder }]}>
          {identityOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleIdentity(opt.value)}
              style={[s.dropOption, { borderBottomColor: inputBorder }, form.identityType === opt.value && { backgroundColor: theme.primary + '22' }]}
            >
              <Text style={[s.dropText, { color: text }, form.identityType === opt.value && { color: theme.primary, fontWeight: '700' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {errors.identityType ? <Text style={s.errorText}>{errors.identityType}</Text> : null}
      {form.identityType === 'TI' && (
        <View style={[s.infoBox, { backgroundColor: isDark ? 'rgba(255,165,0,0.10)' : '#FFF8E7', borderColor: '#FAA61A' }]}>
          <Ionicons name="information-circle-outline" size={14} color="#FAA61A" />
          <Text style={[s.infoText, { color: isDark ? '#FAA61A' : '#8B6000' }]}>{t('register.infoTI')}</Text>
        </View>
      )}
      {form.identityType === 'CC' && (
        <View style={[s.infoBox, { backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : '#F0FFF0', borderColor: theme.primary }]}>
          <Ionicons name="information-circle-outline" size={14} color={theme.primary} />
          <Text style={[s.infoText, { color: isDark ? theme.primary : '#2E6E2A' }]}>{t('register.infoCC')}</Text>
        </View>
      )}
    </View>
  );

  const fieldDocument = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('register.document')}</Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.document ? errorColor : focused === 'document' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="document-text-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.document}
          onChangeText={v => setField('document', v.replace(/\D/g, '').slice(0, 10))}
          placeholder={t('register.documentPlaceholder')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          keyboardType="numeric"
          onFocus={() => setFocused('document')}
          onBlur={() => setFocused(null)}
        />
        <Text style={[s.docCounter, { color: form.document.length === 10 ? theme.primary : muted }]}>
          {form.document.length}/10
        </Text>
      </View>
      {errors.document ? <Text style={s.errorText}>{errors.document}</Text>
        : hints.document ? <Text style={[s.hintText, { color: hintColor('document') }]}>{hints.document}</Text>
        : null}
    </View>
  );

  const fieldEmail = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('register.email')}</Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.email ? errorColor : focused === 'email' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="mail-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.email}
          onChangeText={handleEmail}
          placeholder={t('register.emailPlaceholder')}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused('email')}
          onBlur={() => setFocused(null)}
        />
        {emailValidated && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
      </View>
      {errors.email ? <Text style={s.errorText}>{errors.email}</Text>
        : hints.email ? <Text style={[s.hintText, { color: hintColor('email') }]}>{hints.email}</Text>
        : null}
    </View>
  );

  const validateEmailBtn = (
    <>
      <TouchableOpacity
        onPress={emailValidated ? undefined : handleEmailValidate}
        activeOpacity={emailValidated ? 1 : 0.75}
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
          {emailValidated ? t('register.emailValidated') : t('register.validateEmail')}
        </Text>
      </TouchableOpacity>
      {errors.emailAction ? <Text style={[s.errorText, { marginBottom: 6 }]}>{errors.emailAction}</Text> : null}
    </>
  );

  // ── CAMPO CONTRASEÑA (manual + ojo) ──────────
  const fieldPassword = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('register.password')}</Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.password ? errorColor : focused === 'password' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="lock-closed-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={form.password}
          onChangeText={v => setField('password', v)}
          placeholder={t('register.passwordPlaceholder') ?? 'Contraseña'}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused('password')}
          onBlur={() => setFocused(null)}
        />
        <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={muted} />
        </TouchableOpacity>
      </View>
      <View style={[s.hintBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F5F5F5' }]}>
        <Text style={[s.hintBoxText, { color: muted }]}>{t('register.passwordHint')}</Text>
      </View>
      {errors.password ? <Text style={s.errorText}>{errors.password}</Text>
        : hints.password ? <Text style={[s.hintText, { color: hintColor('password') }]}>{hints.password}</Text>
        : null}
    </View>
  );

  // ── CAMPO CONFIRMAR CONTRASEÑA ────────────────
  const fieldConfirmPassword = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>
        {t('register.confirmPassword') ?? 'Confirmar contraseña'}
      </Text>
      <View style={[s.inputWrap, {
        backgroundColor: inputBg,
        borderColor: errors.confirmPassword ? errorColor : focused === 'confirmPassword' ? activeBorder : inputBorder,
      }]}>
        <Ionicons name="lock-closed-outline" size={18} color={muted} />
        <TextInput
          style={[s.input, { color: text }] as any}
          value={confirmPassword}
          onChangeText={v => {
            setConfirmPassword(v);
            clearError('confirmPassword');
          }}
          placeholder={t('register.confirmPasswordPlaceholder') ?? 'Confirmar contraseña'}
          placeholderTextColor={isDark ? '#5A7258' : '#AAAAAA'}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused('confirmPassword')}
          onBlur={() => setFocused(null)}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={s.eyeBtn}>
          <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={muted} />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword
        ? <Text style={s.errorText}>{errors.confirmPassword}</Text>
        : confirmPassword && confirmPassword === form.password
          ? <Text style={[s.hintText, { color: theme.primary }]}>✓</Text>
          : null}
    </View>
  );
  // ─────────────────────────────────────────────

  const fieldBirthdate = (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: text }]}>{t('register.birthdate')}</Text>
      {Platform.OS === 'web' ? (
        <View style={[s.inputWrap, {
          backgroundColor: inputBg,
          borderColor: errors.birthdate ? errorColor : inputBorder,
        }]}>
          <Ionicons name="calendar-outline" size={18} color={muted} />
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent',
              color: isDark ? '#FFFFFF' : '#111111',
              fontSize: 15, marginLeft: 8,
            }}
            onChange={ev => {
              if (ev.target.value) setBirthdate(new Date(ev.target.value + 'T00:00:00'));
            }}
          />
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={[s.inputWrap, {
            backgroundColor: inputBg,
            borderColor: errors.birthdate ? errorColor : inputBorder,
          }]}
        >
          <Ionicons name="calendar-outline" size={18} color={muted} />
          <Text style={[s.input, { color: birthdate ? text : (isDark ? '#5A7258' : '#AAAAAA') }]}>
            {birthdate ? formatDate(birthdate) : t('register.birthdateSelect')}
          </Text>
        </TouchableOpacity>
      )}
      {errors.birthdate ? <Text style={s.errorText}>{errors.birthdate}</Text> : null}
    </View>
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
            <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>

              <Text style={[s.title, { color: text }]}>{t('register.title')}</Text>
              <Text style={[s.subtitle, { color: muted }]}>{t('register.subtitle')}</Text>

              {/* ══ Datos personales ══ */}
              <View style={[s.sectionHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <Ionicons name="person-outline" size={13} color={theme.primary} />
                <Text style={[s.sectionTitle, { color: theme.primary }]}>{t('register.sections.personal')}</Text>
              </View>
              {isWide ? (
                <>
                  <View style={s.row}><View style={s.col}>{fieldName}</View><View style={s.col}>{fieldLastname}</View></View>
                  <View style={s.row}><View style={s.col}>{fieldIdentity}</View><View style={s.col}>{fieldDocument}</View></View>
                </>
              ) : (
                <>{fieldName}{fieldLastname}{fieldIdentity}{fieldDocument}</>
              )}

              {/* ══ Contacto ══ */}
              <View style={[s.sectionHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <Ionicons name="mail-outline" size={13} color={theme.primary} />
                <Text style={[s.sectionTitle, { color: theme.primary }]}>{t('register.sections.contact')}</Text>
              </View>
              {fieldEmail}
              {validateEmailBtn}

              {/* ══ Seguridad ══ */}
              <View style={[s.sectionHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <Ionicons name="lock-closed-outline" size={13} color={theme.primary} />
                <Text style={[s.sectionTitle, { color: theme.primary }]}>{t('register.sections.security')}</Text>
              </View>
              {isWide ? (
                <>
                  <View style={s.row}>
                    <View style={s.col}>{fieldPassword}</View>
                    <View style={s.col}>{fieldConfirmPassword}</View>
                  </View>
                  <View style={s.row}>
                    <View style={s.col}>{fieldBirthdate}</View>
                    <View style={s.col} />
                  </View>
                </>
              ) : (
                <>
                  {fieldPassword}
                  {fieldConfirmPassword}
                  <View style={[s.sectionHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                    <Ionicons name="calendar-outline" size={13} color={theme.primary} />
                    <Text style={[s.sectionTitle, { color: theme.primary }]}>{t('register.sections.other')}</Text>
                  </View>
                  {fieldBirthdate}
                </>
              )}

              {showPicker && Platform.OS !== 'web' && (
                <DateTimePicker
                  value={birthdate || new Date(2000, 0, 1)}
                  mode="date"
                  maximumDate={new Date()}
                  onChange={(_, date) => { setShowPicker(false); if (date) setBirthdate(date); }}
                />
              )}

              {/* ══ Aceptaciones ══ */}
              <View style={[s.sectionHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }]}>
                <Ionicons name="checkmark-done-outline" size={13} color={theme.primary} />
                <Text style={[s.sectionTitle, { color: theme.primary }]}>{t('register.sections.acceptances')}</Text>
              </View>

              {/* Política */}
              <View style={[s.consentCard, { backgroundColor: checkCardBg, borderColor: checkCardBdr }]}>
                <TouchableOpacity onPress={() => setAccepted(!accepted)} activeOpacity={0.8} style={s.checkRow}>
                  <View style={[s.checkbox, {
                    borderColor:     errors.policy ? errorColor : accepted ? theme.primary : inputBorder,
                    backgroundColor: accepted ? theme.primary : 'transparent',
                  }]}>
                    {accepted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={[s.checkLabel, { color: text }]}>
                    {t('register.policyText')}{' '}
                    <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('register.policyLaw')}</Text>.
                  </Text>
                </TouchableOpacity>
                {errors.policy ? <Text style={[s.errorText, { marginTop: 6 }]}>{errors.policy}</Text> : null}
              </View>

              {/* Derechos */}
              <View style={[s.consentCard, { backgroundColor: checkCardBg, borderColor: checkCardBdr, marginTop: 10 }]}>
                <View style={s.rightsHeader}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                  <Text style={[s.rightsQ, { color: text }]}>{t('register.rightsQuestion')}</Text>
                </View>
                <View style={s.rightsButtons}>
                  <TouchableOpacity
                    onPress={() => setHasRights(true)}
                    style={[s.rightsBtn, {
                      borderColor:     hasRights === true ? theme.primary : (isDark ? 'rgba(255,255,255,0.20)' : '#CCCCCC'),
                      backgroundColor: hasRights === true ? theme.primary : 'transparent',
                    }]}
                  >
                    <Ionicons name="checkmark-outline" size={14} color={hasRights === true ? '#FFFFFF' : muted} />
                    <Text style={[s.rightsBtnText, { color: hasRights === true ? '#FFFFFF' : muted }]}>{t('register.rightsYes')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setHasRights(false)}
                    style={[s.rightsBtn, {
                      borderColor:     hasRights === false ? errorColor : (isDark ? 'rgba(255,255,255,0.20)' : '#CCCCCC'),
                      backgroundColor: hasRights === false ? errorColor : 'transparent',
                    }]}
                  >
                    <Ionicons name="close-outline" size={14} color={hasRights === false ? '#FFFFFF' : muted} />
                    <Text style={[s.rightsBtnText, { color: hasRights === false ? '#FFFFFF' : muted }]}>{t('register.rightsNo')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setShowRights(true)} style={s.rightsReadLink}>
                    <Text style={[s.rightsReadText, { color: linkColor }]}>{t('register.rightsRead')}</Text>
                  </TouchableOpacity>
                </View>
                {errors.rights ? <Text style={[s.errorText, { marginTop: 6 }]}>{errors.rights}</Text> : null}
              </View>

              {/* ══ Botones de acción ══ */}
              <View style={isWide ? s.actionsRow : s.actionsCol}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[s.backBtn, isWide && s.actionBtnWide, { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-outline" size={16} color={muted} />
                  <Text style={[s.backBtnText, { color: muted }]}>{t('register.cancelBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleRegister} style={[s.confirmBtn, isWide && s.actionBtnWide]}>
                  <LinearGradient
                    colors={['#72C96D', '#65B361', '#4FA14B']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={s.confirmBtnGradient}
                  >
                    <Ionicons name="person-add-outline" size={18} color="#FFFFFF" />
                    <Text style={s.confirmBtnText}>{t('register.registerBtn')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={s.footer}>
                <Text style={[s.footerText, { color: muted }]}>{t('register.hasAccount')} </Text>
                <NavLink href={Routes.AUTH.LOGIN} label={t('register.loginLink')} />
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal de derechos */}
      <RightsModal visible={showRights} onClose={() => setShowRights(false)} />
    </LinearGradient>
  );
}

// ── Estilos ───────────────────────────────────
const isWide = width >= 768;

const s = StyleSheet.create({
  gradient:  { flex: 1 },
  safe:      { flex: 1 },
  kav:       { flex: 1 },
  arcTop:    { position: 'absolute', width: 300, height: 420, right: -120, top: -90,    borderRadius: 200, backgroundColor: 'rgba(20,70,28,0.18)' },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120,  bottom: -30, borderRadius: 180, backgroundColor: 'rgba(101,179,97,0.28)' },
  scroll:    { flexGrow: 1, alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  card:      { width: '100%', maxWidth: CARD_MAX, borderRadius: 26, borderWidth: 1, paddingHorizontal: isWide ? 40 : 24, paddingVertical: 30 },
  title:    { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1 },
  sectionTitle:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  fieldGroup: { marginBottom: 12 },
  label:      { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  inputWrap:  { height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input:      { flex: 1, fontSize: 15, outlineStyle: 'none' } as any,
  errorText:  { color: '#D92027', fontSize: 11, marginTop: 3 },
  hintText:   { fontSize: 11, marginTop: 3, fontWeight: '600' },
  docCounter: { fontSize: 12, fontWeight: '700', minWidth: 32, textAlign: 'right' },
  eyeBtn:     { padding: 4 },
  infoBox:    { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  infoText:   { fontSize: 12, flex: 1, lineHeight: 17 },
  dropdown:   { marginTop: 4, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  dropOption: { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1 },
  dropText:   { fontSize: 15 },
  validateBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 10, borderWidth: 1.2, marginBottom: 4, paddingHorizontal: 12 },
  validateBtnText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  hintBox:     { borderRadius: 8, padding: 10, marginTop: 4, marginBottom: 2 },
  hintBoxText: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  consentCard:   { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 6, marginBottom: 4 },
  checkRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox:      { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  checkLabel:    { flex: 1, fontSize: 13, lineHeight: 20 },
  rightsHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  rightsQ:       { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 20 },
  rightsButtons: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  rightsBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, borderWidth: 1.2 },
  rightsBtnText: { fontSize: 13, fontWeight: '700' },
  rightsReadLink:{ marginLeft: 'auto' as any },
  rightsReadText:{ fontSize: 12, fontWeight: '600' },
  actionsRow:    { flexDirection: 'row', gap: 16, marginTop: 24, marginBottom: 8 },
  actionsCol:    { flexDirection: 'column', alignItems: 'center', marginTop: 24, marginBottom: 8 },
  actionBtnWide: { flex: 1, maxWidth: undefined, alignSelf: undefined, width: undefined },
  confirmBtn:         { width: '100%', maxWidth: 300, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  confirmBtnGradient: { paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  confirmBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  backBtn:            { width: '100%', maxWidth: 300, alignSelf: 'center', borderRadius: 16, borderWidth: 1.2, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  backBtnText:        { fontSize: 15, fontWeight: '600' },
  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  footerText: { fontSize: 13 },
});