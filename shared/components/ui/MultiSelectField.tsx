// ─────────────────────────────────────────────
//  shared/components/ui/MultiSelectField.tsx
//  Selector múltiple tipo checklist. No existía un componente para
//  relaciones N:N (ej. Transversal↔Programas, Instructor↔Transversales),
//  así que se creó siguiendo el mismo lenguaje visual que SelectField
//  (misma tipografía, colores de tema, bordes y error) en vez de un
//  <select multiple> nativo, que no es viable en React Native.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFieldProps {
  label: string;
  values: string[];
  options: MultiSelectOption[];
  onToggle: (value: string) => void;
  error?: string;
  emptyText?: string;
  containerStyle?: ViewStyle;
}

export default function MultiSelectField({ label, values, options, onToggle, error, emptyText, containerStyle }: MultiSelectFieldProps) {
  const { theme, isDark } = useTheme();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const border = error ? Colors.error : (isDark ? 'rgba(255,255,255,0.30)' : '#BBBBBB');

  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      <Text style={[ms.label, { color: text }]}>{label}</Text>
      <View style={[ms.box, { borderColor: border }]}>
        {options.length === 0 ? (
          <Text style={[ms.empty, { color: isDark ? '#5A7258' : '#999' }]}>{emptyText ?? '—'}</Text>
        ) : (
          options.map(opt => {
            const isChecked = values.includes(opt.value);
            return (
              <TouchableOpacity key={opt.value} onPress={() => onToggle(opt.value)} style={ms.row} activeOpacity={0.7}>
                <View style={[ms.checkbox, { borderColor: isChecked ? theme.primary : border, backgroundColor: isChecked ? theme.primary : 'transparent' }]}>
                  {isChecked ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
                </View>
                <Text style={{ color: text, fontSize: FontSize.base }}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
      {error ? <Text style={ms.error}>{error}</Text> : null}
    </View>
  );
}

const ms = StyleSheet.create({
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  box: { borderWidth: 1.2, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 12, fontSize: FontSize.sm, fontStyle: 'italic' },
  error: { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },
});
