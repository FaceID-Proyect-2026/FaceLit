// ─────────────────────────────────────────────
//  shared/services/passwordRecoveryService.js
//
//  RF-1.5 — Recuperación de contraseña (backend real)
//  RNF-1.9 — Seguridad del restablecimiento
//
//  Verificar cuenta + código emite una autorización larga de un solo uso.
// ─────────────────────────────────────────────

import { api } from './api';
import { clearRecoveryAuthorization } from './recoveryAuthorization';

// PASO 1 — Solicitar código de recuperación
// POST /api/auth/request-recovery { email } -> { message }
export const requestRecovery = async (email) => {
  clearRecoveryAuthorization();
  const { data } = await api.post('/api/auth/request-recovery', { email });
  return data;
};

// PASO 1.5 — Verificar que el código de 6 dígitos es válido ANTES de avanzar
// POST /api/auth/verify-token { email, token: codigo }
// Respuestas:
//   200           → código válido, se puede continuar
//   400/404/410   → código incorrecto, expirado o ya usado
//   429           → límite de intentos o de tasa; respetar Retry-After
export const verifyToken = async (email, token) => {
  const { data } = await api.post('/api/auth/verify-token', { email, token });
  return data;
};

// PASO 2 — Restablecer contraseña con la autorización emitida al verificar
// POST /api/auth/reset-password { email, token: autorizacion, newPassword, confirmPassword }
// La autorización es de un solo uso y no se envía por correo.
export const resetPassword = async (email, token, newPassword, confirmPassword) => {
  const { data } = await api.post('/api/auth/reset-password', {
    email,
    token,
    newPassword,
    confirmPassword,
  });
  return data;
};

export const completeAccountAccess = async (token, newPassword, confirmPassword) => {
  const { data } = await api.post('/api/auth/complete-access', { token, newPassword, confirmPassword });
  return data;
};
