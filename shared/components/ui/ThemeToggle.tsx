// ─────────────────────────────────────────────
//  shared/components/ui/ThemeToggle.tsx
//  Botón para alternar tema claro/oscuro
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useLanguage } from '@/shared/contexts/I18nContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { persistUserConfigurationPreferences } from '@/shared/services/userConfigService';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface ThemeToggleProps {
  style?: ViewStyle;
}

export default function ThemeToggle({ style }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const controlColor = isDark ? Colors.white : Colors.primaryDark;

  const handleToggle = () => {
    const nextDarkMode = !isDark;
    toggleTheme();
    if (isAuthenticated) {
      void persistUserConfigurationPreferences(language, nextDarkMode).catch(error => {
        console.warn('[Settings] No se pudo guardar el tema seleccionado:', error);
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.75}
      style={[
        s.btn,
        {
          backgroundColor: 'transparent',
          borderColor:     controlColor,
        },
        style,
      ]}
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={15}
        color={controlColor}
      />
      <Text style={[s.label, { color: controlColor }]}>{t('theme.toggle')}</Text>
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