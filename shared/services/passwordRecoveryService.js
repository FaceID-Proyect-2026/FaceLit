// ─────────────────────────────────────────────
//  shared/services/passwordRecoveryService.js
//
//  RF-1.5 — Recuperación de contraseña
//
//  Implementación actual: MOCK completo mientras el backend
//  no esté disponible. Simula el flujo completo:
//    1. requestRecovery(email) → genera un código de 6 dígitos
//       y lo guarda en memoria con TTL de 5 minutos.
//    2. resetPassword(token, newPassword, confirmPassword) →
//       valida que el código exista y no haya expirado,
//       luego simula el cambio de contraseña.
//
//  Para usar el flujo de prueba:
//    · Ingresa cualquier email registrado en MOCK_RECOVERY_EMAILS
//      (definidos en AuthContext.tsx):
//        admin@facelit.test
//        coordinador@facelit.test
//        maria.gonzalez@facelit.test
//        juan.perez@facelit.test
//    · El código generado se imprime en console.info para verlo
//      durante el desarrollo.
//    · El código tiene una vigencia de 5 minutos.
//
//  Cuando el backend esté listo, eliminar el bloque MOCK y
//  descomentar las llamadas reales a `api`.
// ─────────────────────────────────────────────

// import { api } from './api';

// ── Mock store ────────────────────────────────
const TTL_MS = 5 * 60 * 1000; // 5 minutos

/**
 * @type {Map<string, { code: string, expiresAt: number, used: boolean }>}
 * Clave: email normalizado. Valor: estado del código actual.
 */
const mockCodes = new Map();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── API pública ───────────────────────────────

/**
 * Solicita el envío de un código de recuperación al email dado.
 * Mock: genera el código y lo imprime en consola para testing.
 */
export const requestRecovery = async (email) => {
  const key = email.trim().toLowerCase();

  // Simula latencia de red
  await new Promise(r => setTimeout(r, 600));

  const code = generateCode();
  const expiresAt = Date.now() + TTL_MS;
  mockCodes.set(key, { code, expiresAt, used: false });

  // En desarrollo: muestra el código en consola para poder probarlo
  // eslint-disable-next-line no-console
  console.info(`[MOCK Recovery] Código para ${email}: ${code} (válido por 5 min)`);

  return { message: 'Se envió un código de verificación al correo registrado.' };

  /* ── Backend real — descomentar cuando esté disponible ──
  const { data } = await api.post('/api/auth/request-recovery', { email });
  return data;
  */
};

/**
 * Valida el token (código) y establece la nueva contraseña.
 * Mock: busca el código en memoria por email (pasado como parámetro opcional)
 * o busca en todos los registros activos.
 *
 * @param {string} token - El código de 6 dígitos ingresado por el usuario
 * @param {string} newPassword
 * @param {string} confirmPassword
 * @param {string} [email] - Email asociado (pasado desde verify-identity via params)
 */
export const resetPassword = async (token, newPassword, confirmPassword, email) => {
  // Simula latencia de red
  await new Promise(r => setTimeout(r, 500));

  // Buscar el código — primero por email si se provee, luego en todos
  let entry = null;
  let entryKey = null;

  if (email) {
    const key = email.trim().toLowerCase();
    const found = mockCodes.get(key);
    if (found) { entry = found; entryKey = key; }
  }

  // Si no encontró por email, buscar en todos los registros
  if (!entry) {
    for (const [k, v] of mockCodes.entries()) {
      if (v.code === token) { entry = v; entryKey = k; break; }
    }
  }

  if (!entry || entry.code !== token) {
    const err = new Error('Código incorrecto.');
    err.response = { status: 400, data: { message: 'Código incorrecto.' } };
    throw err;
  }

  if (entry.used) {
    const err = new Error('Este código ya fue utilizado.');
    err.response = { status: 409, data: { message: 'Este código ya fue utilizado. Solicita uno nuevo.' } };
    throw err;
  }

  if (Date.now() > entry.expiresAt) {
    const err = new Error('El código ha expirado.');
    err.response = { status: 410, data: { message: 'El código ha expirado. Solicita uno nuevo.' } };
    throw err;
  }

  // Marcar como usado e invalidar
  entry.used = true;
  mockCodes.delete(entryKey);

  // eslint-disable-next-line no-console
  console.info(`[MOCK Recovery] Contraseña restablecida para ${entryKey}`);

  return { message: 'Contraseña restablecida correctamente.' };

  /* ── Backend real — descomentar cuando esté disponible ──
  const { data } = await api.post('/api/auth/reset-password', { token, newPassword, confirmPassword });
  return data;
  */
};
