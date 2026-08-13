// ─────────────────────────────────────────────
//  shared/components/ui/DateField.tsx
//  Selector de fecha reutilizable con calendario:
//  en Web usa <input type="date"> nativo del navegador,
//  en Móvil abre el DateTimePicker nativo del sistema.
//  Mismo patrón que el selector de fecha de nacimiento
//  usado en app/auth/register.tsx.
// ─────────────────────────────────────────────
import { useState } from 'react';
import {
  Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';

interface DateFieldProps {
  label: string;
  value: string; // formato "AAAA-MM-DD"
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  minDate?: string; // "AAAA-MM-DD"
  containerStyle?: ViewStyle;
}

export function formatDateDisplay(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

function toDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(value + 'T00:00:00');
  return new Date();
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DateField({
  label, value, onChange, error, placeholder, minDate, containerStyle,
}: DateFieldProps) {
  const { theme, isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const borderColor = error ? Colors.error : theme.inputBorder;

  return (
    <View style={[s.wrapper, containerStyle]}>
      <Text style={[s.label, { color: theme.text }]}>{label}</Text>

      {Platform.OS === 'web' ? (
        <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor }]}>
          <Ionicons name="calendar-outline" size={18} color={theme.textMuted} />
          {/* @ts-ignore — elemento HTML nativo, solo se renderiza en Web */}
          <input
            type="date"
            value={value || ''}
            min={minDate}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: theme.inputText,
              fontSize: 15,
              marginLeft: 8,
              fontFamily: 'inherit',
            }}
            onChange={(ev: any) => onChange(ev.target.value)}
          />
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          activeOpacity={0.75}
          style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor }]}
        >
          <Ionicons name="calendar-outline" size={18} color={theme.textMuted} />
          <Text style={[s.inputText, { color: value ? theme.inputText : theme.inputPlaceholder }]}>
            {value ? formatDateDisplay(value) : (placeholder || 'AAAA-MM-DD')}
          </Text>
        </TouchableOpacity>
      )}

      {Platform.OS !== 'web' && showPicker && (
        <DateTimePicker
          value={toDate(value)}
          mode="date"
          minimumDate={minDate ? toDate(minDate) : undefined}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => {
            setShowPicker(false);
            if (date) onChange(toIsoDate(date));
          }}
        />
      )}

      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputText: {
    fontSize: FontSize.lg,
    marginLeft: 8,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
