// ─────────────────────────────────────────────
//  app/admin/academic/programs/register.tsx
//  Registrar/editar Programa ahora vive en un modal
//  (ProgramFormModal). Esta ruta se conserva solo como acceso
//  directo por URL: abre el mismo modal sobre un fondo vacío y,
//  al cerrarlo, vuelve a la pantalla anterior.
// ─────────────────────────────────────────────
import ProgramFormModal from '@/features/academic/components/ProgramFormModal';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function ProgramRegisterScreen() {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ProgramFormModal visible editId={id} onClose={() => router.back()} />
    </View>
  );
}
