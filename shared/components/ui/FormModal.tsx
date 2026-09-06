// ─────────────────────────────────────────────
//  shared/components/ui/FormModal.tsx
//  Modal genérico para formularios de creación/edición (Programas,
//  Fichas, etc.). Reutiliza la misma base (Modal + overlay + Pressable)
//  que ya usa AppDialog para que el comportamiento sea idéntico en
//  Web y Móvil, pero con una tarjeta más grande, con scroll interno
//  y un pie de acciones separado del contenido.
// ─────────────────────────────────────────────
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}

export default function FormModal({ visible, onClose, title, subtitle, children, footer, maxWidth = 520 }: FormModalProps) {
  const { isDark } = useTheme();
  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;
  const border = isDark ? 'rgba(101,179,97,0.18)' : 'rgba(101,179,97,0.20)';

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={fm.overlay} onPress={onClose}>
        <Pressable style={[fm.card, { backgroundColor: cardBg, borderColor: border, maxWidth }]} onPress={() => {}}>
          <View style={fm.header}>
            <View style={{ flex: 1 }}>
              <Text style={[fm.title, { color: text }]}>{title}</Text>
              {subtitle ? <Text style={[fm.subtitle, { color: muted }]}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={fm.closeBtn} hitSlop={8}>
              <Ionicons name="close" size={22} color={muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={fm.scroll} contentContainerStyle={fm.scrollContent} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={[fm.footer, { borderTopColor: border }]}>{footer}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const fm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', borderRadius: 18, borderWidth: 1, maxHeight: '90%', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'flex-start', padding: 20, paddingBottom: 12, gap: 12 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.black },
  subtitle: { fontSize: FontSize.sm, marginTop: 4 },
  closeBtn: { padding: 4 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  footer: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
});
