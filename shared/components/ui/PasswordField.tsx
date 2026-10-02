// ─────────────────────────────────────────────
//  shared/components/ui/PasswordField.tsx
//  Campo de contraseña con toggle de visibilidad
// ─────────────────────────────────────────────
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, TextInputProps, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?:          string;
  error?:          string;
  containerStyle?: ViewStyle;
}

export default function PasswordField({
  label,
  error,
  containerStyle,
  style,
  ...props
}: PasswordFieldProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
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

      <View style={[s.row, { backgroundColor: theme.inputBg, borderColor }]}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={focused ? theme.primary : theme.textMuted}
          style={s.icon}
        />
        <TextInput
          style={[s.input, { color: theme.inputText }, style] as any}
          secureTextEntry={!visible}
          placeholderTextColor={theme.inputPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        <TouchableOpacity
          onPress={() => setVisible(v => !v)}
          activeOpacity={0.7}
          style={s.eyeBtn}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.textMuted}
          />
        </TouchableOpacity>
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
    fontSize:     FontSize.base,
    fontWeight:   FontWeight.bold,
    marginBottom: 6,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    height:            48,
    borderWidth:       1.2,
    borderRadius:      12,
    paddingHorizontal: 14,
    gap:               10,
  },
  icon:   { flexShrink: 0 },
  input:  { flex: 1, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  eyeBtn: { padding: 4 },
  error:  { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },
});