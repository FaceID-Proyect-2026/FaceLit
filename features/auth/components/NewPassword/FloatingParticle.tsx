import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function FloatingParticle({
  delay, size, x, y, isDark,
}: { delay: number; size: number; x: string; y: string; isDark: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.15, 0.45, 0.15] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x as any,
        top:  y as any,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: isDark ? 'rgba(101,179,97,0.6)' : 'rgba(50,120,50,0.5)',
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
}
