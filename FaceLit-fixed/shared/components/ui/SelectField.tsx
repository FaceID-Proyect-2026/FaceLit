import { useState } from 'react';
import {
  Modal, Platform, Pressable, StyleSheet,
  Text, TouchableOpacity, View, ViewStyle, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';

interface SelectOption {
  value: string;
  label: string;
}

// Mismo stack tipográfico que usa react-native-web internamente para los
// componentes <Text> del resto de la app (labels, inputs, etc.). Los
// elementos HTML crudos (button/div) NO heredan esta fuente por defecto
// (los navegadores aplican su propia fuente UA a <button>), así que hay
// que fijarla explícitamente para que coincida con el resto de la pantalla.
const WEB_FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onSelect: (value: string) => void;
  error?: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

function SelectFieldWeb({
  label, value, options, onSelect, error, placeholder, containerStyle,
}: SelectFieldProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    // El contenedor sube su z-index SOLO mientras está abierto. Así, cuando
    // hay varios SelectField apilados en el mismo formulario (Ficha, Día,
    // Instructor...), el desplegable abierto siempre queda por encima de los
    // campos que le siguen, y los demás no lo tapan al estar cerrados.
    <View style={[{ marginBottom: 14, zIndex: open ? 20000 : 1 }, containerStyle]}>
      <Text style={[s.label, { color: theme.text }]}>{label}</Text>
      <div style={{ position: 'relative', zIndex: open ? 20000 : 1 }}>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: 48,
            background: theme.inputBg,
            border: `1.2px solid ${error ? Colors.error : theme.inputBorder}`,
            borderRadius: 12,
            padding: '0 14px',
            cursor: 'pointer',
            fontFamily: WEB_FONT_STACK,
            fontSize: FontSize.lg,
            color: selected ? theme.inputText : theme.inputPlaceholder,
            outline: 'none',
          }}
        >
          <span style={{ fontFamily: WEB_FONT_STACK }}>
            {selected ? selected.label : placeholder || 'Seleccionar'}
          </span>
          <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
        </button>
        {open && (
          <div
            style={{
              position: 'absolute',
              top: '105%',
              left: 0,
              right: 0,
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              zIndex: 20000,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              maxHeight: 260,
              overflowY: 'auto',
            }}
          >
            {options.map(opt => {
              const isActive = value === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); setOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: isActive ? theme.primaryFaint : 'transparent',
                    fontFamily: WEB_FONT_STACK,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? theme.primary : theme.text,
                    fontSize: FontSize.base,
                  }}
                  onMouseEnter={(e: any) => {
                    if (!isActive) e.currentTarget.style.background = theme.primaryFaint;
                  }}
                  onMouseLeave={(e: any) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

function SelectFieldMobile({
  label, value, options, onSelect, error, placeholder, containerStyle,
}: SelectFieldProps) {
  const { theme, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <View style={[{ marginBottom: 14 }, containerStyle]}>
      <Text style={[s.label, { color: theme.text }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        style={[s.trigger, {
          backgroundColor: theme.inputBg,
          borderColor: error ? Colors.error : theme.inputBorder,
        }]}
      >
        <Text style={[s.triggerText, {
          color: selected ? theme.inputText : theme.inputPlaceholder,
        }]}>
          {selected ? selected.label : placeholder || 'Seleccionar'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={s.error}>{error}</Text> : null}

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={[s.modal, {
            backgroundColor: isDark ? Colors.dark.card : Colors.white,
            borderColor: theme.border,
          }]}>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map(opt => {
                const isActive = value === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { onSelect(opt.value); setOpen(false); }}
                    style={[s.option, isActive && { backgroundColor: theme.primaryFaint }]}
                  >
                    <Text style={[s.optionText, {
                      color: isActive ? theme.primary : theme.text,
                      fontWeight: isActive ? FontWeight.bold : FontWeight.regular,
                    }]}>
                      {opt.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={18} color={theme.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function SelectField(props: SelectFieldProps) {
  if (Platform.OS === 'web') return <SelectFieldWeb {...props} />;
  return <SelectFieldMobile {...props} />;
}

const s = StyleSheet.create({
  label: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  triggerText: {
    fontSize: FontSize.lg,
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 260,
    maxWidth: '90%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: FontSize.lg,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});