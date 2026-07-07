// shared/components/ui/AppButton.tsx
// Botón reutilizable con gradiente — usado en todas las pantallas
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  fullWidth = true,
  style,
}: AppButtonProps) {
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[s.wrap, fullWidth && s.fullWidth, disabled && s.disabled, style]}
      >
        <LinearGradient
          colors={disabled
            ? ['#888888', '#666666']
            : [Colors.primaryLight, Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.gradient}
        >
          <Text style={s.primaryText}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[s.outline, fullWidth && s.fullWidth, disabled && s.disabled, style]}
      >
        <Text style={s.outlineText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  // ghost
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[s.ghost, style]}
    >
      <Text style={s.ghostText}>{title}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrap:        { borderRadius: 16, overflow: 'hidden' },
  fullWidth:   { width: '100%' },
  disabled:    { opacity: 0.55 },
  gradient:    { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  outline: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 13,
    alignItems: 'center',
  },
  outlineText: { color: Colors.primary, fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  ghost: { alignItems: 'center', paddingVertical: 8 },
  ghostText: { color: Colors.primary, fontSize: FontSize.base, fontWeight: FontWeight.bold },
});