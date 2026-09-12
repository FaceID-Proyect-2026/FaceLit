// ─────────────────────────────────────────────
//  app/apprentice/join-ficha.tsx
//
//  RF-3.3 V4 — Traslado de ficha por código de traslado
//  El aprendiz ingresa el código alfanumérico de 8 caracteres
//  que le entregó el Coordinador para unirse a la ficha destino.
//
//  Funciona para dos casos:
//  1. Aprendiz en orphan pool (Coordinador lo movió con "traslado").
//  2. Aprendiz con ficha activa que quiere trasladarse directamente
//     (el Coordinador generó el transferCode desde la pantalla de la
//     ficha destino y se lo compartió).
// ─────────────────────────────────────────────
import { useAcademic } from '@/features/academic/useAcademic';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JoinFichaScreen() {
  const { theme, isDark } = useTheme();
  const { t }             = useTranslation();
  const { user }          = useAuth();
  const { allFichas, joinFichaByTransferCode } = useAcademic();

  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<{ fichaNumber: string; prevFicha?: string } | null>(null);

  const bg      = isDark ? Colors.dark.background : Colors.light.background;
  const text    = isDark ? Colors.dark.text : Colors.light.text;
  const muted   = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg  = isDark ? '#07120D' : Colors.white;
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : '#F9FFF9';
  const inputBdr= isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)';

  // Verificar si el aprendiz ya tiene ficha activa (no es orphan)
  const currentFicha = allFichas.find(
    f => f.learners.some(l => l.id === user?.id && l.status === 'active'),
  );

  const handleSubmit = () => {
    const trimmed = code.trim().toUpperCase();

    if (!trimmed) {
      setError(t('academic.transferCodeRequired'));
      return;
    }
    if (!/^[A-Z0-9]{8}$/.test(trimmed)) {
      setError(t('academic.transferCodeWrongLength'));
      return;
    }

    setLoading(true);
    setError('');

    const r = joinFichaByTransferCode(user?.id ?? '', trimmed);
    setLoading(false);

    if (r.success) {
      setResult({
        fichaNumber: (r as any).fichaNumber ?? '',
        prevFicha:   (r as any).prevFichaNumber,
      });
      return;
    }

    // Mapear error del store a clave i18n
    const errKey = (r as any).error ?? 'academic.transferCodeNotFound';
    const msgs: Record<string, string> = {
      'academic.transferCodeInvalid':  t('academic.transferCodeInvalid'),
      'academic.transferCodeNotFound': t('academic.transferCodeNotFound'),
      'academic.fichaInactive':        t('academic.fichaInactive'),
      'academic.joinAlreadyInFicha':   t('academic.joinAlreadyInFicha'),
      'academic.learnerNotFound':      t('academic.learnerNotFound', 'Aprendiz no encontrado. Contacta al Coordinador.'),
    };
    setError(msgs[errKey] ?? t('academic.transferCodeNotFound'));
  };

  // ── Pantalla de éxito ─────────────────────
  if (result) {
    return (
      <View style={[s.safe, { backgroundColor: bg }]}>
        <View style={[s.successWrap]}>
          <View style={[s.successIcon, { backgroundColor: Colors.success + '1A', borderColor: Colors.success + '44' }]}>
            <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
          </View>
          <Text style={[s.successTitle, { color: text }]}>
            {t('academic.joinSuccess')} {result.fichaNumber}
          </Text>
          {result.prevFicha && (
            <Text style={[s.successSub, { color: muted }]}>
              Ficha anterior: {result.prevFicha}
            </Text>
          )}
          <TouchableOpacity
            onPress={() => router.replace('/apprentice' as any)}
            style={[s.doneBtn, { backgroundColor: Colors.success }]}
            activeOpacity={0.85}
          >
            <Text style={s.doneBtnText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Pantalla principal ─────────────────────
  return (
    <LinearGradient
      colors={isDark ? ['#000000', '#06170F', '#0B2D17'] : ['#F7FFF4', '#E5F7DF', '#1E4C28']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[s.card, { backgroundColor: cardBg }]}>

              {/* Volver */}
              <TouchableOpacity onPress={() => router.back()} style={s.backRow} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={16} color={theme.primary} />
                <Text style={[s.backText, { color: theme.primary }]}>{t('common.back')}</Text>
              </TouchableOpacity>

              {/* Ícono */}
              <View style={s.iconWrap}>
                <View style={[s.iconCircle, { borderColor: theme.primary + '55', backgroundColor: theme.primary + '12' }]}>
                  <Ionicons name="swap-horizontal-outline" size={36} color={theme.primary} />
                </View>
              </View>

              {/* Título */}
              <Text style={[s.title, { color: text }]}>{t('academic.joinTitle')}</Text>
              <Text style={[s.subtitle, { color: muted }]}>{t('academic.joinSubtitle')}</Text>

              {/* Ficha actual (si tiene) */}
              {currentFicha && (
                <View style={[s.currentFichaBox, { backgroundColor: theme.primary + '0D', borderColor: theme.primary + '33' }]}>
                  <Ionicons name="school-outline" size={14} color={theme.primary} />
                  <Text style={[s.currentFichaText, { color: theme.primary }]}>
                    Ficha actual: {currentFicha.number}
                  </Text>
                </View>
              )}

              {/* Campo de código */}
              <View style={s.fieldGroup}>
                <Text style={[s.label, { color: text }]}>{t('academic.transferCodeLabel')}</Text>
                <TextInput
                  value={code}
                  onChangeText={v => {
                    // Solo alfanumérico, máx 8 chars, mayúsculas
                    setCode(v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8));
                    setError('');
                  }}
                  placeholder={t('academic.joinInputPlaceholder')}
                  placeholderTextColor={isDark ? '#4A6A50' : '#AAAAAA'}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                  style={[s.codeInput, {
                    color: text,
                    backgroundColor: inputBg,
                    borderColor: error ? Colors.error : inputBdr,
                  }]}
                />
                {error ? (
                  <Text style={[s.errorText, { color: Colors.error }]}>{error}</Text>
                ) : (
                  <Text style={[s.hintText, { color: muted }]}>
                    8 caracteres — letras mayúsculas y números
                  </Text>
                )}
              </View>

              {/* Botón */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || code.length < 8}
                style={[s.submitBtn, (loading || code.length < 8) && s.btnDisabled]}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#72C96D', '#65B361', '#4FA14B']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.submitGradient}
                >
                  {loading
                    ? null
                    : <Ionicons name="log-in-outline" size={18} color={Colors.white} />
                  }
                  <Text style={s.submitText}>
                    {loading ? 'Procesando...' : t('academic.joinTitle')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Estilos ───────────────────────────────────
const s = StyleSheet.create({
  gradient:  { flex: 1 },
  safe:      { flex: 1 },
  kav:       { flex: 1 },
  scroll:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 30 },

  card: {
    width: '100%', maxWidth: 460,
    borderRadius: 26, paddingHorizontal: 24, paddingVertical: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 14, elevation: 6,
  },

  backRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  iconWrap:   { alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  title:    { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  currentFichaBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 18, alignSelf: 'center' },
  currentFichaText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 8 },
  codeInput:  {
    borderWidth: 1.5, borderRadius: 14,
    paddingVertical: 16, textAlign: 'center',
    fontSize: 26, fontWeight: FontWeight.black, letterSpacing: 8,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginTop: 5 },
  hintText:  { fontSize: FontSize.xs, marginTop: 5, textAlign: 'center' },

  submitBtn:      { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitText:     { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  btnDisabled:    { opacity: 0.55 },

  // Éxito
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon:  { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
  successSub:   { fontSize: FontSize.base, textAlign: 'center', marginBottom: 28 },
  doneBtn:      { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  doneBtnText:  { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
});
