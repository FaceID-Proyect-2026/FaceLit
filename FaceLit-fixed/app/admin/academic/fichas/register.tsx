// ─────────────────────────────────────────────
//  app/admin/academic/fichas/register.tsx
//  Registrar/editar Ficha ahora vive en un modal (FichaFormModal).
//  Esta ruta se conserva solo como acceso directo por URL: abre el
//  mismo modal sobre un fondo vacío y, al cerrarlo, vuelve a la
//  pantalla anterior.
// ─────────────────────────────────────────────
import FichaFormModal from '@/features/academic/components/FichaFormModal';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function FichaRegisterScreen() {
  const { isDark } = useTheme();
  const { id, programId } = useLocalSearchParams<{ id?: string; programId?: string }>();
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <FichaFormModal visible editId={id} defaultProgramId={programId} onClose={() => router.back()} />
    </View>
  );
}
