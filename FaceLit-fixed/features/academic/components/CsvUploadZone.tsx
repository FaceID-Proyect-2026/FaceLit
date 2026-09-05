// ─────────────────────────────────────────────
//  features/academic/components/CsvUploadZone.tsx
//  Zona para cargar el listado institucional (CSV) de una ficha
//  puntual (RF-3.3). En Web permite arrastrar y soltar el archivo
//  o hacer clic para abrir el explorador; en Móvil usa el selector
//  de documentos nativo (expo-document-picker), igual que ya se usa
//  en otras pantallas del proyecto (p. ej. app/coordinator/institutional-import.tsx).
//
//  Componente nuevo y autocontenido: no modifica ningún store ni
//  pantalla existente, solo expone `onFileRead(text, fileName)`.
// ─────────────────────────────────────────────
import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CsvUploadZoneProps {
  onFileRead: (text: string, fileName: string) => void;
  isDark: boolean;
  disabled?: boolean;
}

export default function CsvUploadZone({ onFileRead, isDark, disabled }: CsvUploadZoneProps) {
  const { t } = useTranslation();
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<View>(null);

  const text = isDark ? Colors.dark.text : Colors.light.text;
  const muted = isDark ? Colors.dark.textMuted : Colors.light.textMuted;
  const cardBg = isDark ? '#0D1F14' : Colors.white;

  const readWebFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setLoading(false);
      onFileRead(String(reader.result ?? ''), file.name);
    };
    reader.onerror = () => setLoading(false);
    reader.readAsText(file);
  };

  // ── Soporte de arrastrar y soltar (solo Web) ──
  useEffect(() => {
    if (Platform.OS !== 'web' || disabled) return;
    // En react-native-web, el ref de un <View> apunta directamente al
    // nodo DOM subyacente, por lo que podemos usar los eventos nativos
    // de drag & drop del navegador.
    const node = dropRef.current as unknown as HTMLElement | null;
    if (!node) return;

    const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragActive(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragActive(false); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) readWebFile(file);
    };

    node.addEventListener('dragover', onDragOver);
    node.addEventListener('dragleave', onDragLeave);
    node.addEventListener('drop', onDrop);
    return () => {
      node.removeEventListener('dragover', onDragOver);
      node.removeEventListener('dragleave', onDragLeave);
      node.removeEventListener('drop', onDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const openWebFilePicker = () => {
    if (disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,text/csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) readWebFile(file);
    };
    input.click();
  };

  const openNativeFilePicker = async () => {
    if (disabled) return;
    const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
    if (result.canceled) return;
    setLoading(true);
    try {
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      onFileRead(content, result.assets[0].name);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = Platform.OS === 'web' ? openWebFilePicker : openNativeFilePicker;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.zone,
        {
          backgroundColor: isDragActive ? 'rgba(101,179,97,0.12)' : cardBg,
          borderColor: isDragActive ? Colors.primary : 'rgba(101,179,97,0.35)',
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <View ref={dropRef} style={styles.inner} pointerEvents="box-none">
        {loading ? (
          <ActivityIndicator color={Colors.primary} />
        ) : (
          <Ionicons name="cloud-upload-outline" size={28} color={Colors.primary} />
        )}
        <Text style={[styles.title, { color: text }]}>
          {t('academic.csvDropTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          {Platform.OS === 'web' ? t('academic.csvDropSubtitleWeb') : t('academic.csvDropSubtitleMobile')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  zone: { borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  inner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 22, paddingHorizontal: 16, gap: 6 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, textAlign: 'center' },
});