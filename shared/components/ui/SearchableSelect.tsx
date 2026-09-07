// ─────────────────────────────────────────────
//  shared/components/ui/SearchableSelect.tsx
//  Campo de selección con búsqueda: el usuario escribe y la lista de
//  opciones se filtra en vivo por coincidencia de texto (label). Pensado
//  para listas medianas/largas (programas, fichas, usuarios) donde un
//  SelectField de solo-clic obliga a desplazarse por todo el listado.
// ─────────────────────────────────────────────
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Platform, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View, ViewStyle,
} from 'react-native';

interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: SearchableOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export default function SearchableSelect({
  label, value, options, onSelect, placeholder, emptyText, disabled, containerStyle,
}: SearchableSelectProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const selected = options.find(o => o.value === value);

  // Mantiene el texto del input sincronizado con la opción seleccionada
  // desde afuera (p. ej. cuando se limpia la selección al cambiar de
  // programa). Si no hay valor, el input queda vacío para poder buscar.
  useEffect(() => {
    if (open) return; // no pisar lo que el usuario está escribiendo
    setQuery(selected ? selected.label : '');
  }, [value, selected?.label, open]);

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    setOpen(true);
    if (value) onSelect('');
  };

  const handlePick = (opt: SearchableOption) => {
    onSelect(opt.value);
    setQuery(opt.label);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleBlur = () => {
    // Pequeño delay para permitir que el onPress de una opción se
    // registre antes de cerrar la lista.
    setTimeout(() => {
      setOpen(false);
      setQuery(selected ? selected.label : '');
    }, 150);
  };

  return (
    <View style={[ss.wrap, { zIndex: open ? 100 : 10, elevation: open ? 20 : 1 }, containerStyle]}>
      <Text style={[ss.label, { color: theme.text }]}>{label}</Text>
      <View style={[
        ss.inputRow,
        { backgroundColor: disabled ? theme.border + '30' : theme.inputBg, borderColor: open ? theme.primary : theme.inputBorder },
      ]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          ref={inputRef}
          style={[ss.input, { color: theme.inputText, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }]}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.inputPlaceholder}
          editable={!disabled}
        />
        {!!value && (
          <Pressable onPress={() => { onSelect(''); setQuery(''); inputRef.current?.focus(); }} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </Pressable>
        )}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.textMuted} />
      </View>

      {open && !disabled && (
        <View style={[ss.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }} nestedScrollEnabled>
            {filtered.length === 0 ? (
              <Text style={[ss.emptyText, { color: theme.textMuted }]}>{emptyText || 'Sin resultados'}</Text>
            ) : (
              filtered.map(opt => {
                const isActive = value === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handlePick(opt)}
                    onPressIn={() => { if (Platform.OS === 'web') inputRef.current?.focus(); }}
                    {...(Platform.OS === 'web' ? { onMouseDown: (e: any) => e.preventDefault() } : {})}
                    style={[ss.option, isActive && { backgroundColor: theme.primaryFaint }]}
                  >
                    <Text style={[ss.optionText, { color: isActive ? theme.primary : theme.text, fontWeight: isActive ? FontWeight.bold : FontWeight.regular }]} numberOfLines={1}>
                      {opt.label}
                    </Text>
                    {!!opt.sublabel && <Text style={{ color: theme.textMuted, fontSize: FontSize.xs }} numberOfLines={1}>{opt.sublabel}</Text>}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const ss = StyleSheet.create({
  wrap: { marginBottom: 14, position: 'relative', zIndex: 10 },
  label: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, borderWidth: 1.2, borderRadius: 12, paddingHorizontal: 14 },
  input: { flex: 1, fontSize: FontSize.md, height: '100%' },
  dropdown: {
    position: 'absolute', top: 78, left: 0, right: 0, borderWidth: 1, borderRadius: 12,
    zIndex: 50, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
    overflow: 'hidden',
  },
  option: { paddingHorizontal: 14, paddingVertical: 12, gap: 2 },
  optionText: { fontSize: FontSize.base },
  emptyText: { fontSize: FontSize.sm, padding: 14, textAlign: 'center' },
});
