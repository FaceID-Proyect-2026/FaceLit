// ─────────────────────────────────────────────
//  features/notifications/types.ts
//  RF-8 V4 — Catálogo completo de notificaciones
//
//  Categorías según RF-8:
//    csv          — Carga institucional por CSV (RF-3.1)
//    transfer     — Traslado de ficha por aprendiz (RF-3.3)
//    attendance   — Asistencia (RF-6)
//    academic     — Gestión académica manual (RF-3.2)
//    security     — Seguridad y accesos (RF-1)
//    facial       — Reconocimiento facial (RF-5 / RF-8.4)
//
//  Canal:
//    'app'        — solo aparece en la campana
//    'app+email'  — campana + correo electrónico (crítico)
// ─────────────────────────────────────────────

export type NotificationCategory =
  | 'csv'
  | 'transfer'
  | 'attendance'
  | 'academic'
  | 'security'
  | 'facial';

export type NotificationChannel = 'app' | 'app+email';

/** IDs tipados del catálogo completo (15 tipos + RF-8.4) */
export type NotificationType =
  // CSV (RF-3.1)
  | 'csv_upload_done'           // 1 — resumen de carga finalizada
  | 'csv_inconsistency'         // 2 — inconsistencia bloqueada (App + Correo)
  | 'csv_transfer_applied'      // 3 — cambio de ficha aplicado
  | 'csv_transfer_rejected'     // 4 — cambio de ficha rechazado
  | 'csv_ref_error'             // 5 — fila con error de referencia
  // Traslado (RF-3.3)
  | 'learner_transferred'       // 6 — traslado completado por código
  // Asistencia (RF-6)
  | 'attendance_absent'         // 7 — inasistencia registrada
  | 'attendance_late'           // 8 — retraso registrado
  | 'attendance_early_exit'     // 9 — salida anticipada
  | 'attendance_no_exit'        // 10 — salida no registrada
  | 'attendance_wrong_env'      // 11 — ambiente/sesión no correspondiente (App + Correo)
  | 'attendance_substitute'     // 12 — sesión por suplencia
  // Gestión académica (RF-3.2)
  | 'academic_delete_blocked'   // 13 — intento de eliminación bloqueado
  // Seguridad (RF-1)
  | 'security_multiple_failures'// 14 — múltiples intentos fallidos (App + Correo)
  | 'security_account_locked'   // 15 — cuenta bloqueada (App + Correo)
  // Reconocimiento facial (RF-8.4)
  | 'facial_reregister_request' // RF-8.4 — solicitud de re-registro

/** Canal por tipo — según columna "Canal" del catálogo RF-8 */
export const NOTIFICATION_CHANNELS: Record<NotificationType, NotificationChannel> = {
  csv_upload_done:            'app',
  csv_inconsistency:          'app+email',
  csv_transfer_applied:       'app',
  csv_transfer_rejected:      'app',
  csv_ref_error:              'app',
  learner_transferred:        'app',
  attendance_absent:          'app',
  attendance_late:            'app',
  attendance_early_exit:      'app',
  attendance_no_exit:         'app',
  attendance_wrong_env:       'app+email',
  attendance_substitute:      'app',
  academic_delete_blocked:    'app',
  security_multiple_failures: 'app+email',
  security_account_locked:    'app+email',
  facial_reregister_request:  'app',
};

/** Metadatos específicos por tipo de notificación */
export interface NotificationMeta {
  // CSV
  csvSummary?: { created: number; updated: number; blocked: number; errors: number };
  conflictRecordId?: string;
  conflictRecordType?: 'program' | 'ficha' | 'learner' | 'instructor';
  // Traslado / aprendiz
  learnerName?: string;
  learnerDocument?: string;
  fromFichaNumber?: string;
  toFichaNumber?: string;
  fichaNumber?: string;
  // Asistencia
  date?: string;
  entryTime?: string;
  delayMinutes?: number;
  environmentName?: string;
  instructorName?: string;
  programName?: string;
  // Seguridad
  accountDocument?: string;
  failedCount?: number;
  lockMinutes?: number;
  // Facial (RF-8.4)
  requestId?: string;       // ID único de la solicitud de re-registro
  facialUserId?: string;
  facialDecision?: 'accepted' | 'rejected';
  decidedBy?: string;
  decidedAt?: string;
  // Académico
  entityType?: string;      // 'program' | 'ficha' | 'learner' | 'instructor'
  entityId?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  channel: NotificationChannel;
  title: string;
  message: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  read: boolean;
  /** Metadatos específicos del evento */
  meta?: NotificationMeta;
  /** Si el canal incluye correo: estado del envío */
  emailStatus?: 'sent' | 'pending' | 'failed';
}

// ─────────────────────────────────────────────
//  Mocks — representan las 15 notificaciones del
//  catálogo + RF-8.4 para demostración
// ─────────────────────────────────────────────
export const MOCK_NOTIFICATIONS_RF8: Notification[] = [
  // 1 — CSV carga finalizada
  {
    id: 'n-1', type: 'csv_upload_done', category: 'csv', channel: 'app',
    title: 'Carga de CSV finalizada',
    message: 'Carga finalizada: 12 creados, 5 actualizados, 2 pendientes de confirmación, 1 con error.',
    date: '2026-09-10', time: '09:14', read: false,
    meta: { csvSummary: { created: 12, updated: 5, blocked: 2, errors: 1 } },
  },
  // 2 — Inconsistencia bloqueada (App + Correo)
  {
    id: 'n-2', type: 'csv_inconsistency', category: 'csv', channel: 'app+email',
    title: 'Inconsistencia pendiente de revisión',
    message: 'El instructor con doc. 5060708090 está asignado al programa ADSO pero el archivo lo mueve a Gestión Administrativa. Confirma el cambio manualmente.',
    date: '2026-09-10', time: '09:14', read: false,
    meta: { conflictRecordId: 'i-2', conflictRecordType: 'instructor', learnerDocument: '5060708090' },
    emailStatus: 'sent',
  },
  // 3 — Cambio de ficha aplicado
  {
    id: 'n-3', type: 'csv_transfer_applied', category: 'csv', channel: 'app',
    title: 'Cambio de ficha aplicado',
    message: 'El aprendiz Juan Pérez (1000000004) fue movido de la ficha 3145555 a la ficha 3145556.',
    date: '2026-09-10', time: '09:15', read: false,
    meta: { learnerName: 'Juan Pérez', learnerDocument: '1000000004', fromFichaNumber: '3145555', toFichaNumber: '3145556' },
  },
  // 4 — Cambio de ficha rechazado
  {
    id: 'n-4', type: 'csv_transfer_rejected', category: 'csv', channel: 'app',
    title: 'Cambio de ficha cancelado',
    message: 'Se decidió no aplicar el cambio de ficha del aprendiz Ana Martínez (1122334455). El registro no fue modificado.',
    date: '2026-09-10', time: '09:16', read: true,
    meta: { learnerName: 'Ana Martínez', learnerDocument: '1122334455', fromFichaNumber: '3145555', toFichaNumber: '3145556' },
  },
  // 5 — Fila CSV con error de referencia
  {
    id: 'n-5', type: 'csv_ref_error', category: 'csv', channel: 'app',
    title: 'Fila con error de referencia',
    message: 'La fila 14 del archivo menciona la ficha 9999999, que no existe ni está siendo creada en este archivo.',
    date: '2026-09-10', time: '09:14', read: true,
    meta: { fichaNumber: '9999999' },
  },
  // 6 — Traslado por código completado
  {
    id: 'n-6', type: 'learner_transferred', category: 'transfer', channel: 'app',
    title: 'Traslado completado por código',
    message: 'Carlos López (2233445566) ingresó el código de traslado y ya está activo en la ficha 3145556. La ficha anterior (3145555) quedó inactiva para él.',
    date: '2026-09-08', time: '10:05', read: false,
    meta: { learnerName: 'Carlos López', learnerDocument: '2233445566', fromFichaNumber: '3145555', toFichaNumber: '3145556' },
  },
  // 7 — Inasistencia
  {
    id: 'n-7', type: 'attendance_absent', category: 'attendance', channel: 'app',
    title: 'Inasistencia registrada',
    message: 'Carlos López (2233445566) no se presentó en la sesión de la ficha 3145555 el lunes 22-jun.',
    date: '2026-06-22', time: '12:01', read: false,
    meta: { learnerName: 'Carlos López', learnerDocument: '2233445566', fichaNumber: '3145555', date: '2026-06-22', environmentName: 'Salón 101', instructorName: 'María González' },
  },
  // 8 — Retraso
  {
    id: 'n-8', type: 'attendance_late', category: 'attendance', channel: 'app',
    title: 'Retraso registrado',
    message: 'Ana Martínez (1122334455) llegó 15 min tarde a la sesión de la ficha 3145555 el lunes 22-jun.',
    date: '2026-06-22', time: '07:15', read: true,
    meta: { learnerName: 'Ana Martínez', learnerDocument: '1122334455', fichaNumber: '3145555', date: '2026-06-22', delayMinutes: 15, entryTime: '07:15', environmentName: 'Salón 101', instructorName: 'María González' },
  },
  // 9 — Salida anticipada
  {
    id: 'n-9', type: 'attendance_early_exit', category: 'attendance', channel: 'app',
    title: 'Salida anticipada registrada',
    message: 'Juan Pérez (1000000004) registró salida a las 10:30, antes de la franja esperada (≥ 12:00), ficha 3145555.',
    date: '2026-06-29', time: '10:30', read: true,
    meta: { learnerName: 'Juan Pérez', learnerDocument: '1000000004', fichaNumber: '3145555', date: '2026-06-29', entryTime: '07:00', environmentName: 'Salón 101', instructorName: 'María González' },
  },
  // 10 — Salida no registrada
  {
    id: 'n-10', type: 'attendance_no_exit', category: 'attendance', channel: 'app',
    title: 'Salida no registrada',
    message: 'Ana Martínez (1122334455) no registró salida en la sesión del 01-jul en la ficha 3145555.',
    date: '2026-07-01', time: '12:05', read: false,
    meta: { learnerName: 'Ana Martínez', learnerDocument: '1122334455', fichaNumber: '3145555', date: '2026-07-01', environmentName: 'Lab. Sistemas', instructorName: 'María González' },
  },
  // 11 — Ambiente no correspondiente (App + Correo)
  {
    id: 'n-11', type: 'attendance_wrong_env', category: 'attendance', channel: 'app+email',
    title: 'Registro en sesión no correspondiente',
    message: 'Juan Pérez (1000000004) se identificó en el Lab. Sistemas, que no corresponde a su ficha 3145555 ese día.',
    date: '2026-07-06', time: '07:02', read: false,
    meta: { learnerName: 'Juan Pérez', learnerDocument: '1000000004', fichaNumber: '3145555', date: '2026-07-06', environmentName: 'Lab. Sistemas' },
    emailStatus: 'sent',
  },
  // 12 — Sesión por suplencia
  {
    id: 'n-12', type: 'attendance_substitute', category: 'attendance', channel: 'app',
    title: 'Sesión abierta por suplencia',
    message: 'Pedro Ramírez abrió la sesión del dispositivo el 06-jul como sustituto de María González para la ficha 3145555.',
    date: '2026-07-06', time: '07:00', read: true,
    meta: { fichaNumber: '3145555', date: '2026-07-06', instructorName: 'Pedro Ramírez' },
  },
  // 13 — Eliminación bloqueada
  {
    id: 'n-13', type: 'academic_delete_blocked', category: 'academic', channel: 'app',
    title: 'Intento de eliminación bloqueado',
    message: 'No fue posible eliminar el programa "Análisis y Desarrollo de Software" porque tiene fichas activas asociadas.',
    date: '2026-09-12', time: '14:22', read: false,
    meta: { entityType: 'program', entityId: '1' },
  },
  // 14 — Múltiples intentos fallidos (App + Correo)
  {
    id: 'n-14', type: 'security_multiple_failures', category: 'security', channel: 'app+email',
    title: 'Múltiples intentos fallidos de sesión',
    message: 'La cuenta con documento 1122334455 acumuló 3 intentos fallidos consecutivos de inicio de sesión.',
    date: '2026-09-12', time: '08:47', read: false,
    meta: { accountDocument: '1122334455', failedCount: 3 },
    emailStatus: 'sent',
  },
  // 15 — Cuenta bloqueada (App + Correo)
  {
    id: 'n-15', type: 'security_account_locked', category: 'security', channel: 'app+email',
    title: 'Cuenta bloqueada por intentos fallidos',
    message: 'La cuenta con documento 1122334455 quedó bloqueada por 5 minutos tras superar el límite de intentos fallidos.',
    date: '2026-09-12', time: '08:48', read: false,
    meta: { accountDocument: '1122334455', failedCount: 5, lockMinutes: 5 },
    emailStatus: 'sent',
  },
  // RF-8.4 — Solicitud de re-registro facial
  {
    id: 'n-rf84', type: 'facial_reregister_request', category: 'facial', channel: 'app',
    title: 'Solicitud de re-registro facial',
    message: 'Juan Pérez (1000000004) solicita volver a registrar su rostro.',
    date: '2026-09-12', time: '11:30', read: false,
    meta: { requestId: 'req-001', facialUserId: 'u-appr-1', learnerName: 'Juan Pérez', learnerDocument: '1000000004' },
  },
];
