// ─────────────────────────────────────────────
//  app/admin/environments/register.tsx
//  Registrar/editar Ambiente ahora vive en un modal
//  (EnvironmentFormModal). Esta ruta se conserva solo como acceso
//  directo por URL: abre el mismo modal sobre un fondo vacío y,
//  al cerrarlo, vuelve a la pantalla anterior.
// ─────────────────────────────────────────────
import EnvironmentFormModal from '@/features/environments/components/EnvironmentFormModal';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function EnvironmentRegisterScreen() {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <EnvironmentFormModal visible editId={id} onClose={() => router.back()} />
    </View>
  );
}
