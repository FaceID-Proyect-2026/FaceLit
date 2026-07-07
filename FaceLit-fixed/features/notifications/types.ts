export type NotificationCategory = 'attendance' | 'schedule' | 'environment' | 'system' | 'facial';
export interface Notification {
  id: string; category: NotificationCategory; title: string; message: string;
  date: string; time: string; read: boolean;
}
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', category: 'attendance', title: 'Asistencia registrada', message: 'Se registró tu asistencia en Salón 101', date: '2026-06-24', time: '07:00', read: false },
  { id: 'n2', category: 'schedule', title: 'Cambio de horario', message: 'La clase del miércoles cambia al jueves', date: '2026-06-23', time: '15:30', read: false },
  { id: 'n3', category: 'environment', title: 'Cambio de ambiente', message: 'Salón 101 cambia a Lab. Sistemas', date: '2026-06-23', time: '14:00', read: true },
  { id: 'n4', category: 'system', title: 'Actualización', message: 'El sistema se actualizará el sábado', date: '2026-06-22', time: '09:00', read: true },
  { id: 'n5', category: 'facial', title: 'Registro facial pendiente', message: 'Debes completar tu registro facial', date: '2026-06-21', time: '08:00', read: false },
  { id: 'n6', category: 'attendance', title: 'Llegada tarde', message: 'Registraste llegada tarde: 15 min de retraso', date: '2026-06-24', time: '07:15', read: false },
];
