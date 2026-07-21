// ─────────────────────────────────────────────
//  app/auth/guardian-verification.tsx
//  El acudiente ingresa el código de 6 dígitos
//  recibido en su correo
// ─────────────────────────────────────────────
import { formatTime, useVerificationCode } from '@/features/auth/hooks/useVerificationCode';
import GradientBackground from '@/shared/components/layout/GradientBackground';
import { AppButton, InputField } from '@/shared/components/ui';
import { Colors } from '@/shared/constants/colors';
import { Routes } from '@/shared/constants/routes';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { confirmConsent, resendConsent } from '@/shared/services/consentService';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ─── Sub-component: Timer badge ───────────────
function TimerBadge({ timeLeft }: { timeLeft: number }) {
    const { t } = useTranslation();
    const color = timeLeft > 60 ? Colors.warning : Colors.error;

    return (
        <View style={[badge.wrap, { backgroundColor: color }]}>
            <Ionicons name="alarm-outline" size={14} color={Colors.white} />
            <Text style={badge.text}>
                {t('guardianVerification.timerLabel')}{formatTime(timeLeft)}
            </Text>
        </View>
    );
}

const badge = StyleSheet.create({
    wrap: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, alignSelf: 'center', marginBottom: 14 },
    text: { color: Colors.white, fontWeight: FontWeight.bold, fontSize: FontSize.md },
});

// ─── Screen ───────────────────────────────────
export default function GuardianVerificationScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { idUser, guardianEmail } = useLocalSearchParams<{ idUser: string; guardianEmail: string }>();

    const {
        code, setCode, timeLeft, expired,
        error, loading, resending, resendCooldown, handleResend, handleVerify,
    } = useVerificationCode({
        namespace: 'guardianVerification',
        checkExpired: true,
        onVerify: async (code) => {
            const result = await confirmConsent(idUser, code);
            if (result.status === 'ACCEPTED') {
                // El acudiente autorizó → el menor va a registrar su rostro
                router.replace(Routes.AUTH.TEENAGER_REGISTRATION as any);
            }
        },
        onResend: async () => {
            await resendConsent(idUser);
        },
    });

    return (
        <GradientBackground>
            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={[s.card, { backgroundColor: theme.card }]}>

                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back-outline" size={16} color={theme.primary} />
                        <Text style={[s.backText, { color: theme.primary }]}>{t('guardianVerification.backBtn')}</Text>
                    </TouchableOpacity>

                    <View style={[s.clockCircle, { borderColor: theme.primary }]}>
                        <Ionicons name="shield-checkmark-outline" size={54} color={theme.primary} />
                    </View>

                    <Text style={[s.title, { color: theme.text }]}>{t('guardianVerification.title')}</Text>

                    <Text style={[s.subtitle, { color: theme.textMuted }]}>{t('guardianVerification.subtitle')}</Text>
                    <Text style={[s.emailText, { color: theme.primary }]}>{guardianEmail || 'correo@ejemplo.com'}</Text>


                    <TouchableOpacity onPress={handleResend} disabled={resending || resendCooldown > 0} style={s.resendBtn}>
                        <Text style={[s.resendText, { color: theme.primary, opacity: (resending || resendCooldown > 0) ? 0.5 : 1 }]}>
                            {resendCooldown > 0
                                ? `Disponible en ${resendCooldown}s`
                                : resending ? 'Reenviando...' : 'Reenviar código'}
                        </Text>
                    </TouchableOpacity>

                    <InputField
                        label={t('guardianVerification.inputLabel')}
                        value={code}
                        onChangeText={setCode}
                        placeholder={t('guardianVerification.placeholder')}
                        keyboardType="number-pad"
                        maxLength={6}
                        error={error}
                        style={s.codeInputText}
                    />

                    <Text style={[s.hint, { color: theme.textMuted }]}>{t('guardianVerification.hint')}</Text>

                    <AppButton
                        title={loading ? (t('guardianVerification.verifying') ?? 'Verificando...') : t('guardianVerification.verifyBtn')}
                        onPress={handleVerify}
                        disabled={expired || loading}
                    />

                </View>
            </ScrollView>
        </GradientBackground>
    );
}

// ─── Styles ────────────────────────────────────
const s = StyleSheet.create({
    scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 20 },
    card: { width: '100%', maxWidth: 900, borderRadius: 26, paddingHorizontal: 24, paddingVertical: 28, shadowColor: Colors.black, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
    backText: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
    clockCircle: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: FontSize.base, textAlign: 'center', lineHeight: 20 },
    emailText: { fontSize: FontSize.base, textAlign: 'center', fontWeight: FontWeight.bold, textDecorationLine: 'underline', marginBottom: 20, marginTop: 4 },
    resendBtn: { alignSelf: 'center', marginBottom: 26 },
    resendText: { fontWeight: FontWeight.bold, textDecorationLine: 'underline', fontSize: FontSize.base },
    codeInputText: { textAlign: 'center', fontSize: 24, letterSpacing: 10 },
    hint: { fontSize: FontSize.sm, marginTop: 8, marginBottom: 22 },
});