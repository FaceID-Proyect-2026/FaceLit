import { Colors } from '@/shared/constants/colors';
import { FontSize } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { modern } from '@/features/academic/components/AcademicProgramsStyles';

export function OnboardingModern({ isDark, theme }: { isDark: boolean; theme: any }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(22)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const soft = theme.primary + '14';
  const border = theme.primary + '33';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.045, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ])).start();
  }, [fade, lift, pulse]);

  const steps = [
    { icon: 'document-text-outline', title: t('academic.onboardingStepTemplate'), description: t('academic.onboardingStepTemplateDescription') },
    { icon: 'create-outline', title: t('academic.onboardingStepFill'), description: t('academic.onboardingStepFillDescription') },
    { icon: 'cloud-upload-outline', title: t('academic.onboardingStepUpload'), description: t('academic.onboardingStepUploadDescription') },
  ];

  return (
    <Animated.View style={[modern.wrap, { opacity: fade, transform: [{ translateY: lift }] }]}>
      <LinearGradient colors={isDark ? ['#10281B', '#08150F', '#050B08'] : ['#EAF8EC', Colors.light.surface, Colors.light.background]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[modern.panel, { borderColor: border }]}>
        <View style={[modern.glow, { backgroundColor: theme.primary + '18' }]} />
        <View style={[modern.hero, compact && modern.heroCompact]}>
          <View style={modern.heroCopy}>
            <View style={[modern.eyebrow, { backgroundColor: soft, borderColor: border }]}>
              <Ionicons name={'sparkles-outline'} size={15} color={theme.primary} />
              <Text style={[modern.eyebrowText, { color: theme.primary }]}>{t('academic.onboardingEyebrow')}</Text>
            </View>
            <Text style={[modern.title, { color: text }]}>{t('academic.onboardingTitle')}</Text>
            <Text style={[modern.subtitle, { color: muted }]}>{t('academic.onboardingDescription')}</Text>
            <View style={modern.benefits}>
              {['academic.onboardingBenefitUpload', 'academic.onboardingBenefitValidation', 'academic.onboardingBenefitSummary'].map(key => (
                <View key={key} style={modern.benefit}><Ionicons name={'checkmark-circle'} size={18} color={theme.primary} /><Text style={[modern.benefitText, { color: text }]}>{t(key)}</Text></View>
              ))}
            </View>
          </View>
          <Animated.View style={[modern.iconScene, { backgroundColor: soft, borderColor: border, transform: [{ scale: pulse }] }]}>
            <View style={[modern.iconRing, { borderColor: theme.primary + '55' }]}><Ionicons name={'school-outline'} size={58} color={theme.primary} /></View>
            <View style={[modern.fileBadge, { backgroundColor: theme.primary }]}><Ionicons name={'document-text'} size={20} color={Colors.white} /><Text style={modern.fileBadgeText}>CSV</Text></View>
          </Animated.View>
        </View>
        <Text style={[modern.kicker, { color: theme.primary }]}>{t('academic.onboardingHowItWorks')}</Text>
        <Text style={[modern.sectionTitle, { color: text }]}>{t('academic.onboardingStepsTitle')}</Text>
        <View style={[modern.steps, compact && modern.stepsCompact]}>
          {steps.map((step, index) => (
            <View key={step.title} style={[modern.stepCard, { backgroundColor: isDark ? '#0B1711' : Colors.light.surface, borderColor: border }]}>
              <Text style={[modern.stepNumber, { color: theme.primary + '55' }]}>0{index + 1}</Text>
              <View style={[modern.stepIcon, { backgroundColor: soft, borderColor: border }]}><Ionicons name={step.icon as any} size={24} color={theme.primary} /></View>
              <Text style={[modern.stepTitle, { color: text }]}>{step.title}</Text>
              <Text style={[modern.stepDesc, { color: muted }]}>{step.description}</Text>
            </View>
          ))}
        </View>
        <View style={[modern.action, { backgroundColor: isDark ? '#0A1A11' : '#F1FAF2', borderColor: border }]}>
          <View style={modern.actionCopy}><Text style={[modern.actionTitle, { color: text }]}>{t('academic.onboardingActionTitle')}</Text><Text style={[modern.actionDesc, { color: muted }]}>{t('academic.onboardingActionDescription')}</Text></View>
          <TouchableOpacity onPress={() => router.push('/admin/academic/csv-upload' as any)} activeOpacity={0.85} style={modern.buttonWrap}>
            <LinearGradient colors={['#72C96D', '#55AD52', '#3D8F43']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modern.button}>
              <Ionicons name={'cloud-upload-outline'} size={21} color={Colors.white} /><Text style={modern.buttonText}>{t('academic.csvUploadShort')}</Text><Ionicons name={'arrow-forward'} size={19} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={modern.hint}><Ionicons name={'information-circle-outline'} size={17} color={muted} /><Text style={{ color: muted, fontSize: FontSize.xs }}>{t('academic.onboardingManualHint')}</Text></View>
      </LinearGradient>
    </Animated.View>
  );
}
