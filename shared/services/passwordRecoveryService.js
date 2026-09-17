// ─────────────────────────────────────────────
//  shared/services/passwordRecoveryService.js
//
//  RF-1.5 — Recuperación de contraseña (backend real)
//  RNF-1.9 — Seguridad del restablecimiento
//
//  El código de 6 dígitos que llega al correo es el `token`. Primero se
//  valida en /api/auth/verify-token y luego se usa en /api/auth/reset-password.
// ─────────────────────────────────────────────

import { api } from './api';

// PASO 1 — Solicitar código de recuperación
// POST /api/auth/request-recovery { email } -> { message }
export const requestRecovery = async (email) => {
  const { data } = await api.post('/api/auth/request-recovery', { email });
  return data;
};

// PASO 1.5 — Verificar que el código de 6 dígitos es válido ANTES de avanzar
// POST /api/auth/verify-token { token }
// Respuestas:
//   200           → código válido, se puede continuar
//   400/404/410   → código incorrecto, expirado o ya usado
//   500           → el backend lanza excepción (token no encontrado en BD)
//                   lo tratamos como código incorrecto
export const verifyToken = async (token) => {
  const { data } = await api.post('/api/auth/verify-token', { token });
  return data;
};

// PASO 2 — Restablecer contraseña con el código recibido por correo
// POST /api/auth/reset-password { token, newPassword, confirmPassword }
// `token` aquí es el código de 6 dígitos enviado al correo.
export const resetPassword = async (token, newPassword, confirmPassword) => {
  const { data } = await api.post('/api/auth/reset-password', {
    token,
    newPassword,
    confirmPassword,
  });
  return data;
};