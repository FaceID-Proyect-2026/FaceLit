// ─────────────────────────────────────────────
//  shared/components/ui/AppDialog.tsx
//  Diálogo de confirmación/alerta multiplataforma.
//
//  Por qué existe: `Alert.alert` de React Native NO
//  funciona en Web (react-native-web no implementa
//  los botones ni sus callbacks `onPress`). Esto hacía
//  que acciones como "Eliminar" o la confirmación
//  posterior a "Guardar" nunca se ejecutaran en Web,
//  aunque sí funcionaban en Móvil.
//
//  AppDialog reemplaza `Alert.alert` con un modal propio
//  (basado en `Modal` de React Native, que sí es soportado
//  en Web, iOS y Android) para que el comportamiento sea
//  idéntico en todas las plataformas.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface AppDialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AppDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppDialogButton[];
  onRequestClose: () => void;
  onPressButton: (button: AppDialogButton) => void;
}

export default function AppDialog({ visible, title, message, buttons, onRequestClose, onPressButton }: AppDialogProps) {
  const { theme, isDark } = useTheme();

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';

  const colorFor = (style?: AppDialogButton['style']) => {
    if (style === 'destructive') return Colors.error;
    if (style === 'cancel') return muted;
    return theme.primary;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={ad.overlay} onPress={onRequestClose}>
        <Pressable style={[ad.card, { backgroundColor: cardBg, borderColor: border }]} onPress={() => {}}>
          <Text style={[ad.title, { color: text }]}>{title}</Text>
          {message ? <Text style={[ad.message, { color: muted }]}>{message}</Text> : null}
          <View style={ad.buttonsRow}>
            {buttons.map((btn, idx) => (
              <TouchableOpacity
                key={`${btn.text}-${idx}`}
                onPress={() => onPressButton(btn)}
                style={[ad.button, { borderColor: border }, idx === buttons.length - 1 && ad.buttonLast]}
                activeOpacity={0.7}
              >
                <Text style={[ad.buttonText, { color: colorFor(btn.style) }]}>{btn.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const ad = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 16, borderWidth: 1, paddingTop: 20, overflow: 'hidden' },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.black, textAlign: 'center', paddingHorizontal: 20 },
  message: { fontSize: FontSize.md, textAlign: 'center', marginTop: 8, paddingHorizontal: 20, lineHeight: 20 },
  buttonsRow: { flexDirection: 'row', marginTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(101,179,97,0.20)' },
  button: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth },
  buttonLast: { borderRightWidth: 0 },
  buttonText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, textAlign: 'center' },
});
