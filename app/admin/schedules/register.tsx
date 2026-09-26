// ─────────────────────────────────────────────
//  app/admin/schedules/register.tsx
//  Registrar/editar Horario ahora vive en un modal
//  (ScheduleFormModal). Esta ruta se conserva solo como acceso
//  directo por URL: abre el mismo modal sobre un fondo vacío y,
//  al cerrarlo, vuelve a la pantalla anterior.
// ─────────────────────────────────────────────
import ScheduleFormModal from '@/features/schedules/components/ScheduleFormModal';
import { Colors } from '@/shared/constants/colors';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function ScheduleRegisterScreen() {
  const { isDark } = useTheme();
  const { id, fichaId } = useLocalSearchParams<{ id?: string; fichaId?: string }>();
  const bg = isDark ? Colors.dark.background : Colors.light.background;

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScheduleFormModal visible editId={id} defaultFichaId={fichaId} onClose={() => router.back()} />
    </View>
  );
}
