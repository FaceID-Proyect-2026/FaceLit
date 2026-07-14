// ─────────────────────────────────────────────
//  features/auth/components/SectionHeader.tsx
//  Encabezado de sección para formularios
// ─────────────────────────────────────────────
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { FontSize, FontWeight } from '@/shared/constants/typography';

interface SectionHeaderProps {
  icon:  keyof typeof Ionicons.glyphMap;
  label: string;
}

export default function SectionHeader({ icon, label }: SectionHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[s.row, { borderBottomColor: theme.border }]}>
      <Ionicons name={icon} size={13} color={theme.primary} />
      <Text style={[s.label, { color: theme.primary }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    marginTop:      22,
    marginBottom:   12,
    paddingBottom:  8,
    borderBottomWidth: 1,
  },
  label: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.black,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});