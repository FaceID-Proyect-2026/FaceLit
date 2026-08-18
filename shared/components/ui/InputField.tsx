// ─────────────────────────────────────────────
//  shared/components/ui/InputField.tsx
//  Campo de texto reutilizable con soporte
//  de tema, error y focus
// ─────────────────────────────────────────────
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';

// ── Tipos ─────────────────────────────────────
interface InputFieldProps extends TextInputProps {
  label?:      string;
  error?:      string;
  icon?:       keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

// ── Componente ────────────────────────────────
export default function InputField({
  label,
  error,
  icon,
  containerStyle,
  style,
  ...props
}: InputFieldProps) {
  const { theme, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? theme.primary
    : theme.inputBorder;

  return (
    <View style={[s.wrapper, containerStyle]}>
      {label ? (
        <Text style={[s.label, { color: theme.text }]}>{label}</Text>
      ) : null}

      <View style={[
        s.row,
        {
          backgroundColor: theme.inputBg,
          borderColor,
        },
      ]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? theme.primary : theme.textMuted}
            style={s.icon}
          />
        ) : null}

        <TextInput
          style={[
            s.input,
            { color: theme.inputText },
            style,
          ] as any}
          placeholderTextColor={theme.inputPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>

      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize:    FontSize.base,
    fontWeight:  FontWeight.bold,
    marginBottom: 6,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    height:         48,
    borderWidth:    1.2,
    borderRadius:   12,
    paddingHorizontal: 14,
    gap: 10,
  },
  icon:  { flexShrink: 0 },
  input: {
    flex:      1,
    fontSize:  FontSize.lg,
    outlineStyle: 'none',
  } as any,
  error: {
    color:     Colors.error,
    fontSize:  FontSize.xs,
    marginTop: 4,
  },
});