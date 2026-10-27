import { Colors } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, Modal, Text, TouchableOpacity, View } from 'react-native';
import { sm } from '@/features/auth/components/NewPasswordStyles';

export function SuccessModal({ visible, onContinue, isDark }: {
  visible: boolean;
  onContinue: () => void;
  isDark: boolean;
}) {
  const { t } = useTranslation();
  const bg    = isDark ? '#07120D' : Colors.light.surface;
  const text  = isDark ? '#FFFFFF' : '#111111';
  const muted = isDark ? '#CAD6C8' : '#3D5C3A';

  // Animación de entrada del modal
  const scaleAnim   = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible, opacityAnim, scaleAnim]);

  const ITEMS = [
    t('passwordResetDone.security.item1'),
    t('passwordResetDone.security.item2'),
    t('passwordResetDone.security.item3'),
    t('passwordResetDone.security.item4'),
  ];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={sm.overlay}>
        <Animated.View
          style={[
            sm.card,
            { backgroundColor: bg },
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Ícono */}
          <View style={sm.iconWrap}>
            <Image source={require('@/assets/images/check.png')} style={sm.icon} resizeMode="contain" />
          </View>

          <Text style={[sm.title,    { color: text  }]}>{t('passwordResetDone.title')}</Text>
          <Text style={[sm.subtitle, { color: muted }]}>{t('passwordResetDone.subtitle1')}</Text>
          <Text style={[sm.subtitle, { color: muted, marginBottom: 18 }]}>{t('passwordResetDone.subtitle2')}</Text>

          {/* Registro de seguridad */}
          <View style={[sm.log, {
            backgroundColor: isDark ? 'rgba(101,179,97,0.08)' : 'rgba(101,179,97,0.06)',
            borderColor: 'rgba(101,179,97,0.25)',
          }]}>
            <Text style={sm.logTitle}>{t('passwordResetDone.securityTitle')}</Text>
            {ITEMS.map((item, i) => (
              <View key={i} style={sm.logRow}>
                <Ionicons name="checkmark-circle" size={13} color="#65B361" />
                <Text style={[sm.logItem, { color: muted }]}>{item}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={sm.btn} onPress={onContinue} activeOpacity={0.85}>
            <LinearGradient colors={['#72C96D', '#65B361', '#4FA14B']} style={sm.btnGradient}>
              <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
              <Text style={sm.btnText}>{t('passwordResetDone.loginBtn')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
