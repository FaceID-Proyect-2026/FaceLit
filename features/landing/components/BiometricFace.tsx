import { Colors } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Text, View } from 'react-native';

export function BiometricFace({ color, isDark }: { color: string; isDark: boolean }) {
  const { t } = useTranslation();

  const pulseAnim  = useRef(new Animated.Value(0)).current;
  const scanAnim   = useRef(new Animated.Value(0)).current;
  const dotAnim    = useRef(new Animated.Value(0.3)).current;
  const glowAnim   = useRef(new Animated.Value(0)).current;

  // Índice numérico en estado — el texto se obtiene con t() en cada render
  // para que responda al cambio de idioma sin reiniciar el timer.
  const [statusIdx, setStatusIdx] = useState(0);
  const STATUS_COUNT = 5;

  // t() keys en orden fijo — nunca se modifican
  const statusLabel = t(`hero.faceStatus.s${statusIdx}` as any,
    // fallback por si la clave aún no tiene traducción
    { defaultValue: ['Inicializando...','Analizando...','Verificando...','Calculando...','Listo'][statusIdx] }
  );

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.delay(300),
      Animated.timing(scanAnim, { toValue: 0, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.delay(300),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(dotAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      Animated.delay(1000),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
    ])).start();

    const timer = setInterval(() => {
      setStatusIdx(i => (i + 1) % STATUS_COUNT);
    }, 2200);
    return () => clearInterval(timer);
  }, [dotAnim, glowAnim, pulseAnim, scanAnim]);

  const pulseScale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, 0.45, 0.1] });
  const scanY        = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-72, 72] });
  const glowOpacity  = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] });

  const SIZE  = 180;
  const bg    = isDark ? '#030C06' : Colors.light.surfaceSecondary;
  const pill  = color + '1A';
  const pillB = color + '44';

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Anillo pulsante exterior */}
      <Animated.View style={{
        position: 'absolute',
        width: SIZE + 40, height: SIZE + 40,
        borderRadius: (SIZE + 40) / 2,
        borderWidth: 1.5, borderColor: color,
        transform: [{ scale: pulseScale }],
        opacity: pulseOpacity,
        top: -20,
      }} />

      {/* Círculo principal */}
      <View style={{
        width: SIZE, height: SIZE,
        borderRadius: SIZE / 2,
        borderWidth: 2, borderColor: color,
        backgroundColor: bg,
        overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Brillo */}
        <Animated.View style={{
          position: 'absolute', width: '100%', height: '100%',
          backgroundColor: color, opacity: glowOpacity, borderRadius: SIZE / 2,
        }} />

        {/* Línea de escaneo */}
        <Animated.View style={{
          position: 'absolute', width: '78%', height: 1.5,
          backgroundColor: color, opacity: 0.75,
          transform: [{ translateY: scanY }],
        }} />

        {/* Ícono de persona — limpio, sin detalles raros */}
        <Ionicons name="person-circle-outline" size={108} color={color} style={{ opacity: 0.92 }} />

        {/* Esquinas de encuadre */}
        {[
          { top: 10, left: 10 },
          { top: 10, right: 10 },
          { bottom: 10, left: 10 },
          { bottom: 10, right: 10 },
        ].map((pos, i) => {
          const isTop    = 'top'    in pos;
          const isLeft   = 'left'   in pos;
          return (
            <View key={i} style={[{
              position: 'absolute', width: 16, height: 16,
              borderColor: color,
              borderTopWidth:    isTop  ? 2.5 : 0,
              borderBottomWidth: !isTop ? 2.5 : 0,
              borderLeftWidth:   isLeft ? 2.5 : 0,
              borderRightWidth:  !isLeft ? 2.5 : 0,
              borderTopLeftRadius:     (isTop  && isLeft)  ? 3 : 0,
              borderTopRightRadius:    (isTop  && !isLeft) ? 3 : 0,
              borderBottomLeftRadius:  (!isTop && isLeft)  ? 3 : 0,
              borderBottomRightRadius: (!isTop && !isLeft) ? 3 : 0,
            }, pos as any]} />
          );
        })}

        {/* Puntos biométricos laterales */}
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 52, left: 36 }} />
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 52, right: 36 }} />
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 90, left: 30 }} />
        <Animated.View style={{ position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, opacity: dotAnim, top: 90, right: 30 }} />
      </View>

      {/* Barra de estado — texto desde t() → reactivo al cambio de idioma */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
        backgroundColor: pill, borderWidth: 1, borderColor: pillB,
      }}>
        <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: dotAnim }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color, letterSpacing: 0.5 }}>
          {statusLabel}
        </Text>
        <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, opacity: dotAnim }} />
      </View>
    </View>
  );
}
