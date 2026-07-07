// ─────────────────────────────────────────────
//  shared/components/layout/GradientBackground.tsx
//  Fondo degradado reutilizable para pantallas auth
// ─────────────────────────────────────────────
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/contexts/ThemeContext';

interface GradientBackgroundProps {
  children: React.ReactNode;
  withArcs?: boolean;
}

export default function GradientBackground({
  children,
  withArcs = true,
}: GradientBackgroundProps) {
  const { theme, isDark } = useTheme();

  return (
    <LinearGradient
      colors={theme.gradientColors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      {withArcs && (
        <>
          <View style={[s.arcTop, {
            backgroundColor: isDark
              ? 'rgba(101,179,97,0.08)'
              : 'rgba(20,70,28,0.18)',
          }]} />
          <View style={[s.arcBottom, {
            backgroundColor: isDark
              ? 'rgba(101,179,97,0.22)'
              : 'rgba(101,179,97,0.28)',
          }]} />
        </>
      )}
      <SafeAreaView style={s.safe}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: { flex: 1 },
  safe:     { flex: 1, backgroundColor: 'transparent' },
  arcTop: {
    position: 'absolute', width: 300, height: 420,
    right: -120, top: -90, borderRadius: 200,
  },
  arcBottom: {
    position: 'absolute', width: 420, height: 220,
    left: -120, bottom: -30, borderRadius: 180,
  },
});