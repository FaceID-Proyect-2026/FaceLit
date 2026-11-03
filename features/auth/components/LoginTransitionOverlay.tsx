import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginTransitionOverlay({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const ripple3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const animation = Animated.sequence([
      // Fase 1: aparece el fondo y las ondas
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(ripple1, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(ripple2, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1, duration: 350, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]),
      Animated.timing(ripple3, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      // Fase 2: sostenido brevemente y luego navega
      Animated.delay(150),
    ]);
    animation.start(({ finished }) => { if (finished) onDone(); });
    return () => animation.stop();
  }, [visible, onDone, opacity, ripple1, ripple2, ripple3, scale]);

  if (!visible) return null;

  const r1Size = ripple1.interpolate({ inputRange: [0, 1], outputRange: [0, width * 3.5] });
  const r2Size = ripple2.interpolate({ inputRange: [0, 1], outputRange: [0, width * 2.8] });
  const r3Size = ripple3.interpolate({ inputRange: [0, 1], outputRange: [0, width * 2.0] });
  const r1Op = ripple1.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.25, 0] });
  const r2Op = ripple2.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.45, 0.2, 0] });
  const r3Op = ripple3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.35, 0.1] });
  const iconScale = scale.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <Animated.View style={[so.overlay, { opacity }]}>
      {/* Ondas de ripple */}
      <Animated.View style={[so.ripple, { width: r1Size, height: r1Size, borderRadius: 9999, opacity: r1Op, backgroundColor: 'rgba(101,179,97,0.35)' }]} />
      <Animated.View style={[so.ripple, { width: r2Size, height: r2Size, borderRadius: 9999, opacity: r2Op, backgroundColor: 'rgba(101,179,97,0.28)' }]} />
      <Animated.View style={[so.ripple, { width: r3Size, height: r3Size, borderRadius: 9999, opacity: r3Op, backgroundColor: 'rgba(101,179,97,0.22)' }]} />

      {/* Ícono central */}
      <Animated.View style={[so.iconWrap, { transform: [{ scale: iconScale }] }]}>
        <View style={so.iconCircle}>
          <Ionicons name="key-outline" size={36} color="#FFFFFF" />
        </View>
        <Text style={so.iconLabel}>{t('login.recoveringAccess')}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const so = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4,28,14,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  ripple: {
    position: 'absolute',
    alignSelf: 'center',
  },
  iconWrap: { alignItems: 'center', gap: 14 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(101,179,97,0.25)',
    borderWidth: 2, borderColor: '#65B361',
    alignItems: 'center', justifyContent: 'center',
  },
  iconLabel: { color: '#A8D8A4', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
