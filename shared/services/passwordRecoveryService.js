// ─────────────────────────────────────────────
//  shared/services/passwordRecoveryService.js
//
//  RF-1.5 — Recuperación de contraseña (mock completo)
//  RNF-1.9 — Seguridad del restablecimiento
//
//  Flujo mock:
//    1. requestRecovery(email)  → genera código 6 dígitos, TTL 5 min
//    2. verifyCode(email, code) → valida código (máx 5 intentos)
//    3. resetPassword(token, newPassword, confirmPassword, email)
//       → invalida el token y simula el cambio
//
//  Correos de prueba (registrados en MOCK_ACCOUNTS de AuthContext):
//    ┌─────────────────────────────────────────────────────────┐
//    │  Rol           │ Correo                           │ Pass │
//    ├────────────────┼──────────────────────────────────┼──────┤
//    │  Admin         │ admin@facelit.test               │ *    │
//    │  Coordinador   │ coordinador@facelit.test         │ *    │
//    │  Instructor    │ maria.gonzalez@facelit.test      │ *    │
//    │  Aprendiz      │ juan.perez@facelit.test          │ *    │
//    └─────────────────────────────────────────────────────────┘
//
//  El código generado se imprime en console.info para poder copiarlo
//  durante el desarrollo sin necesitar un servidor de correo.
//
//  Cuando el backend esté listo, descomentar las llamadas reales a
//  `api` y eliminar el bloque mock.
// ─────────────────────────────────────────────

// import { api } from './api';

// ── Constantes RF-1 V4 ────────────────────────
const TTL_MS           = 5 * 60 * 1000;  // 5 minutos
const MAX_ATTEMPTS     = 5;              // máx intentos de validación

// ── Store en memoria ──────────────────────────
// Clave: email normalizado
// Valor: { code, expiresAt, used, attempts, verifiedToken }
//   verifiedToken: string | null — token generado tras verificación OK
//   para que resetPassword pueda confirmar que la verificación ocurrió
const mockStore = new Map();

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// ── 1. Solicitar código de recuperación ───────
export const requestRecovery = async (email) => {
  await new Promise(r => setTimeout(r, 500));

  const key  = normalizeEmail(email);
  const code = generateCode();

  mockStore.set(key, {
    code,
    expiresAt:     Date.now() + TTL_MS,
    used:          false,
    attempts:      0,
    verifiedToken: null,
  });

  // En desarrollo: muestra el código para poder probarlo
  // eslint-disable-next-line no-console
  console.info(
    `\n[MOCK Recovery] ─────────────────────────────\n` +
    `  Correo: ${email}\n` +
    `  Código: ${code}\n` +
    `  Válido: 5 minutos\n` +
    `─────────────────────────────────────────────\n`
  );

  return { message: 'Si el correo está registrado, recibirás un código.' };

  /* Backend real:
  const { data } = await api.post('/api/auth/request-recovery', { email });
  return data;
  */
};

// ── 2. Verificar código (pantalla verify-identity) ──
// Devuelve { token } si el código es correcto.
// Lanza error con status para que useVerificationCode lo clasifique.
export const verifyCode = async (email, code) => {
  await new Promise(r => setTimeout(r, 400));

  // ── CÓDIGO QUEMADO PARA PRUEBAS ──────────────
  // Ingresa "123456" en cualquier momento para pasar directo
  // a la pantalla de nueva contraseña, sin necesitar el código
  // real de la consola.
  const BYPASS_CODE = '123456';
  if (code === BYPASS_CODE) {
    const token = generateToken();
    // eslint-disable-next-line no-console
    console.info(`[MOCK Recovery] Código de prueba aceptado → token: ${token}`);
    return { token };
  }

  const key   = normalizeEmail(email ?? '');

  // DEBUG — ayuda a rastrear problemas en desarrollo
  // eslint-disable-next-line no-console
  console.info(`[MOCK verifyCode] email="${key}" code="${code}" store_keys=[${[...mockStore.keys()].join(', ')}]`);

  const entry = key ? mockStore.get(key) : null;

  // Si no encontró por email, buscar en todos (fallback por si los params llegan vacíos)
  let resolvedEntry = entry;
  let resolvedKey   = key;
  if (!resolvedEntry) {
    for (const [k, v] of mockStore.entries()) {
      resolvedEntry = v;
      resolvedKey   = k;
      break; // tomar el primer registro disponible
    }
  }

  // Código no generado
  if (!resolvedEntry) {
    const err = new Error('Código incorrecto.');
    err.response = { status: 400, data: { message: 'Código incorrecto.' } };
    throw err;
  }

  // Ya fue usado
  if (resolvedEntry.used) {
    const err = new Error('Este código ya fue utilizado.');
    err.response = { status: 409, data: { message: 'Este código ya fue utilizado. Solicita uno nuevo.' } };
    throw err;
  }

  // Expirado
  if (Date.now() > resolvedEntry.expiresAt) {
    const err = new Error('El código ha expirado.');
    err.response = { status: 410, data: { message: 'El código ha expirado. Solicita uno nuevo.' } };
    throw err;
  }

  // Incrementar contador de intentos ANTES de validar
  resolvedEntry.attempts += 1;

  if (resolvedEntry.code !== code) {
    if (resolvedEntry.attempts >= MAX_ATTEMPTS) {
      resolvedEntry.used = true;
      const err = new Error('Intentos agotados.');
      err.response = { status: 429, data: { message: 'intentos agotados' } };
      throw err;
    }
    const err = new Error('Código incorrecto.');
    err.response = { status: 400, data: { message: 'Código incorrecto.' } };
    throw err;
  }

  // Código correcto — generar token de sesión de recuperación
  const token = generateToken();
  resolvedEntry.verifiedToken = token;
  resolvedEntry.used = true;

  // eslint-disable-next-line no-console
  console.info(`[MOCK Recovery] Código verificado para ${resolvedKey}. Token: ${token}`);

  return { token };

  /* Backend real:
  const { data } = await api.post('/api/auth/verify-recovery-code', { email, code });
  return data; // { token }
  */
};

// ── 3. Restablecer contraseña ─────────────────
// Recibe el token generado en verifyCode() y las nuevas contraseñas.
export const resetPassword = async (token, newPassword, confirmPassword, email) => {
  await new Promise(r => setTimeout(r, 500));

  const key   = normalizeEmail(email ?? '');
  const entry = email ? mockStore.get(key) : null;

  // Buscar por token si no se encontró por email
  let entryFound = entry;
  let entryKey   = key;
  if (!entryFound) {
    for (const [k, v] of mockStore.entries()) {
      if (v.verifiedToken === token) { entryFound = v; entryKey = k; break; }
    }
  }

  if (!entryFound || entryFound.verifiedToken !== token) {
    const err = new Error('Token inválido.');
    err.response = { status: 400, data: { message: 'Token de verificación inválido.' } };
    throw err;
  }

  // Invalidar el token
  entryFound.verifiedToken = null;
  mockStore.delete(entryKey);

  // eslint-disable-next-line no-console
  console.info(`[MOCK Recovery] Contraseña restablecida para ${entryKey}`);

  return { message: 'Contraseña restablecida correctamente.' };

  /* Backend real:
  const { data } = await api.post('/api/auth/reset-password', { token, newPassword, confirmPassword });
  return data;
  */
};
