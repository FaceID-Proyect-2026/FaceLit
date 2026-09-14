// ─────────────────────────────────────────────
//  features/auth/components/ShutterButton.tsx
//  Vista pura: botón de disparo de cámara.
//  Sin lógica de negocio.
// ─────────────────────────────────────────────
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

interface ShutterButtonProps {
  primaryColor: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}

export default function ShutterButton({ primaryColor, disabled, loading, onPress }: ShutterButtonProps) {
  return (
    <View style={s.shutterContainer}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[s.shutterOuter, { borderColor: primaryColor, opacity: disabled ? 0.5 : 1 }]}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={primaryColor} />
        ) : (
          <View style={[s.shutterInner, { backgroundColor: primaryColor }]} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  shutterContainer: { position: 'absolute', bottom: 20, left: 0, right: 0, alignItems: 'center' },
  shutterOuter:      { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  shutterInner:      { width: 46, height: 46, borderRadius: 23 },
});
