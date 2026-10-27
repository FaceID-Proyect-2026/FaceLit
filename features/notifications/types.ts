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
  | 'attendance_corrected'
  | 'facial_authorization_expired'
  | 'user_role_changed'
  | 'email_delivery_failed'
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
  | 'academic_entity_created'
  | 'academic_entity_updated'
  | 'academic_entity_activated'
  | 'academic_entity_deactivated'
  | 'academic_entity_deleted'
  | 'instructor_profile_updated'
  | 'instructor_assignment_updated'
  | 'apprentice_transfer_applied'
  // Seguridad (RF-1)
  | 'security_multiple_failures'// 14 — múltiples intentos fallidos (App + Correo)
  | 'security_account_locked'   // 15 — cuenta bloqueada (App + Correo)
  // Reconocimiento facial (RF-8.4)
  | 'facial_reregister_request' // RF-8.4 — solicitud de re-registro
  | 'facial_session_substitution' // Sesión configurada para otro instructor responsable
  | 'attendance_excuse_registered'
  | 'attendance_exit_reminder'
  | 'attendance_session_summary'
  | 'session_assigned'
  | 'session_updated'
  | 'session_cancelled'
  | 'user_account_created'
  | 'user_profile_updated'
  | 'apprentice_profile_updated'
  | 'facial_request_resolved'
  | 'facial_registration_completed'
  | 'password_changed'
  | 'account_status_changed'

/** Canal por tipo — según columna "Canal" del catálogo RF-8 */
export const NOTIFICATION_CHANNELS: Record<NotificationType, NotificationChannel> = {
  attendance_corrected: 'app+email',
  facial_authorization_expired: 'app',
  user_role_changed: 'app+email',
  email_delivery_failed: 'app',
  csv_upload_done:            'app',
  csv_inconsistency:          'app+email',
  csv_transfer_applied:       'app',
  csv_transfer_rejected:      'app',
  csv_ref_error:              'app',
  learner_transferred:        'app+email',
  attendance_absent:          'app',
  attendance_late:            'app',
  attendance_early_exit:      'app',
  attendance_no_exit:         'app',
  attendance_wrong_env:       'app+email',
  attendance_substitute:      'app',
  academic_delete_blocked:    'app',
  academic_entity_created:    'app',
  academic_entity_updated:    'app',
  academic_entity_activated:  'app',
  academic_entity_deactivated: 'app',
  academic_entity_deleted:    'app',
  instructor_profile_updated: 'app',
  instructor_assignment_updated: 'app',
  apprentice_transfer_applied: 'app+email',
  security_multiple_failures: 'app+email',
  security_account_locked:    'app+email',
  facial_reregister_request:  'app+email',
  facial_session_substitution: 'app+email',
  attendance_excuse_registered: 'app+email',
  attendance_exit_reminder: 'app+email',
  attendance_session_summary: 'app+email',
  session_assigned: 'app+email',
  session_updated: 'app+email',
  session_cancelled: 'app+email',
  user_account_created: 'app',
  user_profile_updated: 'app',
  apprentice_profile_updated: 'app',
  facial_request_resolved: 'app+email',
  facial_registration_completed: 'app',
  password_changed: 'app+email',
  account_status_changed: 'app+email',
};

/** Metadatos específicos por tipo de notificación */
export interface NotificationMeta {
  profileChanges?: { field: string; before: string; after: string }[];
  [key: string]: unknown;
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
  exitTime?: string;
  delayMinutes?: number;
  environmentName?: string;
  instructorName?: string;
  configuredByName?: string;
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
  decidedByName?: string;
  decidedAt?: string;
  previousStatus?: string;
  newStatus?: string;
  previousDatetime?: string;
  newDatetime?: string;
  previousExcuse?: boolean;
  newExcuse?: boolean;
  eventType?: string;
  changedByName?: string;
  previousRole?: string;
  newRole?: string;
  correctionReason?: string;
  correctionReasonCode?: string;
  affectedUserName?: string;
  originalTitle?: string;
  originalType?: string;
  attemptCount?: number;
  recipientName?: string;
  recipientContext?: 'learner' | 'responsible_instructor' | 'account_owner' | 'coordinator';
  occurredAt?: string;
  correctedAt?: string;
  // Académico
  entityType?: string;      // 'program' | 'ficha' | 'learner' | 'instructor'
  entityId?: string;
}

export interface Notification {
  id: string;
  /** Usuario destinatario. Si falta, la notificación es institucional (solo administración). */
  recipientUserId?: string;
  type: NotificationType;
  category: NotificationCategory;
  channel: NotificationChannel;
  title: string;
  message: string;
  /** Original instant for ordering; display date/time use America/Bogota. */
  createdAt?: string;
  /** Colombia calendar date YYYY-MM-DD */
  date: string;
  /** Colombia clock time HH:MM */
  time: string;
  read: boolean;
  /** Metadatos específicos del evento */
  meta?: NotificationMeta;
  /** Si el canal incluye correo: estado del envío */
  emailStatus?: 'sent' | 'pending' | 'failed';
}
