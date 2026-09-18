// ─────────────────────────────────────────────
//  shared/components/ui/ThemeToggle.tsx
//  Botón para alternar tema claro/oscuro
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface ThemeToggleProps {
  style?: ViewStyle;
}

export default function ThemeToggle({ style }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      activeOpacity={0.75}
      style={[
        s.btn,
        {
          backgroundColor: 'transparent',
          borderColor:     Colors.secondary,
        },
        style,
      ]}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={15}
        color={Colors.secondary}
      />
      <Text style={[s.label, { color: Colors.secondary }]}>{t('theme.toggle')}</Text>
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