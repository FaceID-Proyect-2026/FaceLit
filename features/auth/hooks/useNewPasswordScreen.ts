import { Colors } from '@/shared/constants/colors';
import { useNewPasswordForm } from '@/features/auth/hooks/useNewPasswordForm';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing } from 'react-native';

export function useNewPasswordScreen() {
  const { t }             = useTranslation();
  const { isDark, theme } = useTheme();

  const {
    password, confirmPassword,
    errors, requirements, loading, showSuccess, isAccessLink, recoveryEmail,
    setPassword, setConfirmPassword, handleSubmit,
  } = useNewPasswordForm();

  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Animaciones de entrada ────────────────────
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(36)).current;

  // Animaciones escalonadas por sección
  const iconAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const reqAnim    = useRef(new Animated.Value(0)).current;
  const field1Anim = useRef(new Animated.Value(0)).current;
  const field2Anim = useRef(new Animated.Value(0)).current;
  const btnAnim    = useRef(new Animated.Value(0)).current;

  // Pulso del botón submit
  const btnPulse   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrada de la tarjeta
    Animated.parallel([
      Animated.timing(cardAnim,  { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(cardSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Aparición escalonada de elementos
    Animated.stagger(90, [
      Animated.timing(iconAnim,   { toValue: 1, duration: 420, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
      Animated.timing(titleAnim,  { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(reqAnim,    { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(field1Anim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(field2Anim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(btnAnim,    { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Pulso continuo del botón
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.035, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1,     duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const timeout = setTimeout(() => pulse.start(), 1800);
    return () => {
      clearTimeout(timeout);
      pulse.stop();
    };
  }, [btnAnim, btnPulse, cardAnim, cardSlide, field1Anim, field2Anim, iconAnim, reqAnim, titleAnim]);

  const makeSlide = (anim: Animated.Value, offsetY = 18) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) }],
  });

  // Escala del ícono
  const iconScale = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  // Colores
  const text    = isDark ? '#FFFFFF' : '#111111';
  const muted   = isDark ? '#CAD6C8' : '#3D5C3A';
  const cardBg  = isDark ? '#07120D' : Colors.light.surface;
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : Colors.light.inputBg;
  const inputBdr= isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)';

  // Partículas decorativas
  const PARTICLES = [
    { size: 8,  x: '8%',  y: '12%', delay: 0    },
    { size: 5,  x: '88%', y: '8%',  delay: 600  },
    { size: 10, x: '75%', y: '22%', delay: 1200 },
    { size: 6,  x: '15%', y: '55%', delay: 400  },
    { size: 7,  x: '90%', y: '60%', delay: 900  },
    { size: 4,  x: '50%', y: '5%',  delay: 1500 },
    { size: 9,  x: '5%',  y: '80%', delay: 200  },
    { size: 5,  x: '92%', y: '85%', delay: 1100 },
  ];

    return {
    t,
    isDark,
    theme,
    password,
    confirmPassword,
    errors,
    requirements,
    loading,
    showSuccess,
    isAccessLink,
    recoveryEmail,
    setPassword,
    setConfirmPassword,
    handleSubmit,
    showPwd,
    setShowPwd,
    showConfirm,
    setShowConfirm,
    cardAnim,
    cardSlide,
    iconAnim,
    titleAnim,
    reqAnim,
    field1Anim,
    field2Anim,
    btnAnim,
    btnPulse,
    makeSlide,
    iconScale,
    text,
    muted,
    cardBg,
    inputBg,
    inputBdr,
    PARTICLES,
  };
}
