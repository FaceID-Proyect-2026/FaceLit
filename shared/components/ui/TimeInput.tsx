import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, TextInput, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (value24h: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

const DIGITS_ONLY = /^\d*$/;

function to12h(time24: string): { display: string; meridiem: 'AM' | 'PM' } {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time24)) {
    return { display: '', meridiem: 'AM' };
  }
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr;
  const meridiem: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const display = `${h.toString().padStart(2, '0')}:${m}`;
  return { display, meridiem };
}

function to24h(display: string, meridiem: 'AM' | 'PM'): string {
  const cleaned = display.replace(/[^0-9]/g, '').slice(0, 4);
  if (cleaned.length < 4) return '';
  let h = parseInt(cleaned.slice(0, 2), 10);
  const m = cleaned.slice(2, 4);
  if (h < 1 || h > 12) h = 12;
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m}`;
}

function formatDisplay(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function validateHour(digits: string): boolean {
  if (digits.length === 0) return true;
  const h = parseInt(digits, 10);
  return h >= 1 && h <= 12;
}

function validateMinutes(digits: string): boolean {
  // digits = solo los dígitos de minutos ya escritos (0, 1 o 2 caracteres)
  if (digits.length === 0) return true;
  if (digits.length === 1) return true; // aún no hay suficiente info para descartar
  const m = parseInt(digits, 10);
  return m >= 0 && m <= 59;
}

export default function TimeInput({
  label, value, onChange, error, containerStyle,
}: TimeInputProps) {
  const { theme, isDark } = useTheme();

  const [displayTime, setDisplayTime] = useState('');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const { display, meridiem: m } = to12h(value);
    setDisplayTime(display);
    setMeridiem(m);
  }, [value]);

  const handleTextChange = (raw: string) => {
    const rawDigits = raw.replace(/[^0-9]/g, '');
    if (!DIGITS_ONLY.test(rawDigits)) return;

    const formatted = formatDisplay(raw);
    const digits = formatted.replace(/[^0-9]/g, '');

    // Hora: solo 1-12
    if (digits.length >= 3 && !validateHour(digits.slice(0, 2))) return;
    // Minutos: solo 00-59
    if (digits.length >= 3 && !validateMinutes(digits.slice(2, 4))) return;

    setDisplayTime(formatted);
    if (formatted.length === 0) {
      onChange('');
    } else if (formatted.length === 5) {
      const result = to24h(formatted, meridiem);
      if (result) onChange(result);
    }
    // Entrada incompleta (1-4 dígitos): se mantiene solo en el estado local
    // (displayTime) sin notificar al padre todavía, para no perder lo escrito.
  };

  const toggleMeridiem = () => {
    const next = meridiem === 'AM' ? 'PM' : 'AM';
    setMeridiem(next);
    if (displayTime.length === 5) {
      const result = to24h(displayTime, next);
      if (result) onChange(result);
    }
  };

  const borderColor = error
    ? Colors.error
    : focused
    ? theme.primary
    : theme.inputBorder;

  return (
    <View style={[s.wrapper, containerStyle]}>
      <Text style={[s.label, { color: theme.text }]}>{label}</Text>
      <View style={s.timeRow}>
        <View style={[s.inputWrap, { backgroundColor: theme.inputBg, borderColor }]}>
          <TextInput
            style={[s.input, { color: theme.inputText }] as any}
            value={displayTime}
            onChangeText={handleTextChange}
            placeholder="HH:MM"
            placeholderTextColor={theme.inputPlaceholder}
            keyboardType="number-pad"
            maxLength={5}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity
          onPress={toggleMeridiem}
          activeOpacity={0.7}
          style={[s.meridiemBtn, {
            backgroundColor: theme.inputBg,
            borderColor,
          }]}
        >
          <Text style={[s.meridiemText, { color: theme.primary }]}>{meridiem}</Text>
        </TouchableOpacity>
      </View>
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
  timeRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    height: 48,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {
    fontSize: FontSize.lg,
    outlineStyle: 'none' as any,
    padding: 0,
    margin: 0,
  } as any,
  meridiemBtn: {
    height: 48,
    minWidth: 56,
    borderWidth: 1.2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  meridiemText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});