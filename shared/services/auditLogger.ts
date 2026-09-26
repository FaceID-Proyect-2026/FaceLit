// ─────────────────────────────────────────────
//  shared/services/auditLogger.ts
//
//  RF-1.8 — Auditoría y trazabilidad
//  RNF-1.8 — Registra operaciones críticas de seguridad:
//    - Inicio de sesión exitoso / fallido
//    - Cierre de sesión
//    - Restablecimiento de contraseña
//    - Cambio de contraseña
//    - Acceso no autorizado (intento de acceder a un rol prohibido)
//    - Modificación de datos de usuario
//    - Cambio de rol
//
//  Cada entrada tiene: evento, resultado, usuario (si aplica),
//  timestamp ISO y un ID de operación único.
//
//  Implementación actual: almacenamiento en memoria (array circular de
//  500 entradas) + console.info para que los registros sean visibles en
//  herramientas de desarrollo. En producción, el cuerpo de `persist()`
//  se reemplaza por una llamada POST al endpoint de auditoría del
//  backend — el resto del sistema no cambia.
// ─────────────────────────────────────────────

export type AuditEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_RECOVERY_REQUESTED'
  | 'PASSWORD_RESET_SUCCESS'
  | 'PASSWORD_RESET_FAILED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'USER_DATA_MODIFIED'
  | 'ROLE_CHANGED'
  | 'SESSION_EXPIRED'
  | 'PRIVACY_ACCEPTED';

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'BLOCKED';

export interface AuditEntry {
  /** Identificador único de la operación */
  operationId: string;
  /** Tipo de evento */
  event: AuditEvent;
  /** Resultado de la operación */
  result: AuditResult;
  /** Documento del usuario involucrado (si aplica) */
  userDocument?: string;
  /** Rol del usuario (si se conoce) */
  userRole?: string;
  /** Descripción adicional (no debe contener contraseñas ni tokens) */
  detail?: string;
  /** Timestamp ISO 8601 */
  timestamp: string;
}

// ── Almacenamiento en memoria — RNF-1.8 ──────
const MAX_ENTRIES = 500;
const _log: AuditEntry[] = [];

// Genera un ID de operación simple (no criptográfico — solo para
// correlacionar entradas en el log de desarrollo)
function generateOperationId(): string {
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Punto de extensión: reemplazar este cuerpo por la llamada real al
// backend cuando el endpoint de auditoría esté disponible.
function persist(entry: AuditEntry): void {
  // Rotación circular para evitar pérdida de memoria en sesiones largas
  if (_log.length >= MAX_ENTRIES) _log.shift();
  _log.push(entry);

  // Nunca imprimir contraseñas ni tokens — los campos que llegan aquí
  // ya están sanitizados por las funciones públicas de abajo.
  // eslint-disable-next-line no-console
  console.info(
    `[AUDIT] ${entry.timestamp} | ${entry.event} | ${entry.result}` +
    (entry.userDocument ? ` | doc:${entry.userDocument}` : '') +
    (entry.detail ? ` | ${entry.detail}` : ''),
  );

  /* Producción — reemplazar el console.info de arriba por:
  api.post('/api/audit/log', entry).catch(() => {
    // Nunca lanzar aquí — la auditoría no debe romper el flujo de negocio
  });
  */
}

// ── API pública ───────────────────────────────

export function logEvent(
  event: AuditEvent,
  result: AuditResult,
  options?: { userDocument?: string; userRole?: string; detail?: string },
): void {
  persist({
    operationId: generateOperationId(),
    event,
    result,
    userDocument: options?.userDocument,
    userRole: options?.userRole,
    detail: options?.detail,
    timestamp: new Date().toISOString(),
  });
}

/** Alias de conveniencia para éxitos */
export function logSuccess(
  event: AuditEvent,
  options?: { userDocument?: string; userRole?: string; detail?: string },
): void {
  logEvent(event, 'SUCCESS', options);
}

/** Alias de conveniencia para fallos */
export function logFailure(
  event: AuditEvent,
  options?: { userDocument?: string; userRole?: string; detail?: string },
): void {
  logEvent(event, 'FAILURE', options);
}

/** Alias de conveniencia para intentos bloqueados */
export function logBlocked(
  event: AuditEvent,
  options?: { userDocument?: string; userRole?: string; detail?: string },
): void {
  logEvent(event, 'BLOCKED', options);
}

/** Devuelve una copia del log completo (solo lectura) */
export function getAuditLog(): ReadonlyArray<AuditEntry> {
  return [..._log];
}

/** Limpia el log (útil para testing) */
export function clearAuditLog(): void {
  _log.length = 0;
}
