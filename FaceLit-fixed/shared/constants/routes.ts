// ─────────────────────────────────────────────
//  shared/constants/routes.ts
//  Rutas centralizadas — nunca escribir strings
//  de rutas directamente en los componentes
// ─────────────────────────────────────────────

export const Routes = {
  // Landing
  LANDING: '/' as const,

  // Auth — Módulo 1
  AUTH: {
    LOGIN:                  '/auth/login',
    REGISTER:               '/auth/register',
    EMAIL_VALIDATION:       '/auth/email-validation',
    EMAIL_VALIDATED:        '/auth/email-validated-success',
    PASSWORD_RECOVERY:      '/auth/password-recovery',
    VERIFY_IDENTITY:        '/auth/verify-identity',
    NEW_PASSWORD:           '/auth/new-password',
    PASSWORD_RESET_DONE:    '/auth/password-reset-done',
    REGISTRATION_SUCCESS:   '/auth/registration-success',
    TEENAGER_REGISTRATION:  '/auth/teenager-registration',
    MINOR_CONSENT:          '/auth/minor-consent',
    RIGHTS:                 '/auth/rights',
    PRIVACY_NOTICE:         '/auth/privacy-notice',
  },

  // Admin Dashboard
  ADMIN: {
    DASHBOARD:    '/admin',
    PROFILE:      '/admin/profile',
    SETTINGS:     '/admin/profile/settings',
  },

  // Módulo 2: Gestión de Ambientes
  ENVIRONMENTS: {
    LIST:         '/admin/environments',
    REGISTER:     '/admin/environments/register',
    DETAIL:       '/admin/environments/[id]',
    EDIT:         '/admin/environments/[id]/edit',
    ASSIGN:       '/admin/environments/assign',
  },

  // Módulo 3: Gestión Académica
  ACADEMIC: {
    PROGRAMS:           '/admin/academic',
    PROGRAM_REGISTER:   '/admin/academic/programs/register',
    PROGRAM_DETAIL:     '/admin/academic/programs/[id]',
    PROGRAM_EDIT:       '/admin/academic/programs/[id]/edit',
    FICHAS:             '/admin/academic/fichas',
    FICHA_REGISTER:     '/admin/academic/fichas/register',
    FICHA_DETAIL:       '/admin/academic/fichas/[id]',
    FICHA_EDIT:         '/admin/academic/fichas/[id]/edit',
    JOIN_FICHA:         '/apprentice/join-ficha',
    LEARNERS_BY_FICHA:  '/admin/academic/fichas/[id]/learners',
  },

  // Módulo 4: Gestión de Horarios
  SCHEDULES: {
    LIST:         '/admin/schedules',
    REGISTER:     '/admin/schedules/register',
    DETAIL:       '/admin/schedules/[id]',
    EDIT:         '/admin/schedules/[id]/edit',
    EXCEPTIONS:   '/admin/schedules/exceptions',
    INSTRUCTOR:   '/instructor/schedules',
    APPRENTICE:   '/apprentice/schedules',
  },

  // Módulo 5: Reconocimiento Facial
  FACIAL: {
    MANAGEMENT:   '/admin/facial',
    REGISTER:     '/facial/register',
    VERIFY:       '/facial/verify',
  },

  // Módulo 6: Asistencias y Validaciones
  ATTENDANCE: {
    LIST:         '/admin/attendance',
    DETAIL:       '/admin/attendance/[id]',
    INSTRUCTOR:   '/instructor/attendance',
    APPRENTICE:   '/apprentice/attendance',
  },

  // Módulo 7: Reportes y Consultas
  REPORTS: {
    DASHBOARD:    '/admin/reports',
    BY_USER:      '/admin/reports/by-user',
    BY_FICHA:     '/admin/reports/by-ficha',
    CALENDAR:     '/admin/reports/calendar',
    INSTRUCTOR:   '/instructor/reports',
    APPRENTICE:   '/apprentice/reports',
  },

  // Módulo 8: Notificaciones
  NOTIFICATIONS: {
    CENTER:       '/notifications',
  },

  // Módulo 9: Perfil y Personalización
  PROFILE: {
    VIEW:         '/profile',
    SETTINGS:     '/profile/settings',
  },
} as const;
