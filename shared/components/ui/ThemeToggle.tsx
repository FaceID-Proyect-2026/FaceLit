// ─────────────────────────────────────────────
//  shared/components/ui/ThemeToggle.tsx
//  Botón para alternar tema claro/oscuro
// ─────────────────────────────────────────────
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface ThemeToggleProps {
  style?: ViewStyle;
}

export default function ThemeToggle({ style }: ThemeToggleProps) {
  const { isDark, toggleTheme, theme } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.75}
      style={[
        s.btn,
        {
          backgroundColor: theme.inputBg,
          borderColor:     theme.primary,
        },
        style,
      ]}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={15}
        color={theme.primary}
      />
      <Text style={[s.label, { color: theme.primary }]}>{t('theme.toggle')}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    height:            40,
    borderRadius:      20,
    borderWidth:       1.5,
    paddingHorizontal: 14,
  },
  label: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
  },
});