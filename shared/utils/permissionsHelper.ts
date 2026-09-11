// ─────────────────────────────────────────────
//  shared/utils/permissionsHelper.ts
//
//  RF-1.3 — Derechos de acceso / RBAC
//  RNF-1.4 — Control de acceso basado en roles
//  RNF-1.5 — Restricción de información por rol
//  RNF-1.15 — Separación de responsabilidades
//  RNF-1.16 — Integridad de los permisos
//
//  Centraliza la lógica de permisos para que el frontend y el backend
//  compartan la misma fuente de verdad conceptual. Las validaciones de
//  seguridad críticas DEBEN también aplicarse en el backend; las de
//  aquí protegen la interfaz y mejoran UX, pero no reemplazan al
//  servidor.
// ─────────────────────────────────────────────

import { UserRole } from '@/shared/contexts/AuthContext';

// ── Matriz de permisos por rol ─────────────────
// Cada permiso es una cadena que describe UNA operación atómica.
// La lista está alineada con la Matriz RF-1.3.
export type Permission =
  // Consulta de datos propios
  | 'VIEW_OWN_DATA'
  | 'VIEW_OWN_ATTENDANCE'
  | 'VIEW_OWN_ACADEMIC_INFO'
  // Instructor
  | 'VIEW_ASSIGNED_FICHAS'
  | 'VIEW_ASSIGNED_FICHA_ATTENDANCE'
  | 'VIEW_ASSIGNED_APPRENTICES'
  // Coordinador / Admin
  | 'VIEW_ALL_USERS'
  | 'CREATE_USER'
  | 'UPDATE_USER_DATA'
  | 'ACTIVATE_DEACTIVATE_USER'
  | 'ASSIGN_ROLE'
  | 'MANAGE_INSTRUCTOR_FICHA'
  | 'VIEW_ALL_ATTENDANCE'
  | 'VIEW_ALL_FICHAS'
  | 'VIEW_ALL_ACADEMIC_INFO'
  | 'MANAGE_ENVIRONMENTS'
  | 'MANAGE_SCHEDULES'
  | 'VIEW_REPORTS'
  | 'MANAGE_FICHAS'
  | 'MANAGE_PROGRAMS';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  APPRENTICE: [
    'VIEW_OWN_DATA',
    'VIEW_OWN_ATTENDANCE',
    'VIEW_OWN_ACADEMIC_INFO',
  ],
  INSTRUCTOR: [
    'VIEW_OWN_DATA',
    'VIEW_ASSIGNED_FICHAS',
    'VIEW_ASSIGNED_FICHA_ATTENDANCE',
    'VIEW_ASSIGNED_APPRENTICES',
  ],
  COORDINATOR: [
    'VIEW_OWN_DATA',
    'VIEW_ALL_USERS',
    'CREATE_USER',
    'UPDATE_USER_DATA',
    'ACTIVATE_DEACTIVATE_USER',
    'ASSIGN_ROLE',
    'MANAGE_INSTRUCTOR_FICHA',
    'VIEW_ALL_ATTENDANCE',
    'VIEW_ALL_FICHAS',
    'VIEW_ALL_ACADEMIC_INFO',
    'VIEW_OWN_ATTENDANCE',
    'MANAGE_ENVIRONMENTS',
    'MANAGE_SCHEDULES',
    'VIEW_REPORTS',
    'MANAGE_FICHAS',
    'MANAGE_PROGRAMS',
  ],
  // ADMINISTRATOR tiene los mismos derechos que COORDINATOR
  // (RF-1.1 V3: Coordinador y Admin son el mismo rol, solo distinto nombre)
  ADMINISTRATOR: [
    'VIEW_OWN_DATA',
    'VIEW_ALL_USERS',
    'CREATE_USER',
    'UPDATE_USER_DATA',
    'ACTIVATE_DEACTIVATE_USER',
    'ASSIGN_ROLE',
    'MANAGE_INSTRUCTOR_FICHA',
    'VIEW_ALL_ATTENDANCE',
    'VIEW_ALL_FICHAS',
    'VIEW_ALL_ACADEMIC_INFO',
    'VIEW_OWN_ATTENDANCE',
    'MANAGE_ENVIRONMENTS',
    'MANAGE_SCHEDULES',
    'VIEW_REPORTS',
    'MANAGE_FICHAS',
    'MANAGE_PROGRAMS',
  ],
};

// ── Funciones públicas ─────────────────────────

/**
 * Devuelve true si el rol tiene el permiso indicado.
 * RNF-1.4: las validaciones se aplican también en el backend.
 */
export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Devuelve todos los permisos de un rol.
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Devuelve true si el rol tiene TODOS los permisos indicados.
 */
export function hasAllPermissions(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Devuelve true si el rol tiene AL MENOS UNO de los permisos indicados.
 */
export function hasAnyPermission(role: UserRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Devuelve true si el rol está autorizado para operar dentro de un
 * área determinada (admin, instructor, apprentice).
 *
 * RF-1.3 / RF-1.4: un usuario NO puede acceder a áreas de otro rol
 * aunque esté autenticado.
 */
export function isRoleAllowed(
  currentRole: UserRole | null | undefined,
  allowedRoles: UserRole[],
): boolean {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
}

/**
 * RNF-1.7: Aprendices e Instructores no pueden modificar datos personales.
 * Solo el Coordinador/Admin puede hacerlo.
 */
export function canModifyUserData(role: UserRole | null | undefined): boolean {
  return hasPermission(role, 'UPDATE_USER_DATA');
}

/**
 * RF-1.3: Un Instructor solo puede ver las fichas/asistencias que tiene
 * asignadas. El sistema debe validar esto en cada consulta.
 * Esta función indica si el rol SIEMPRE tiene acceso irrestricto (coordinador)
 * o si debe restringirse a las entidades asignadas (instructor).
 */
export function hasUnrestrictedDataAccess(role: UserRole | null | undefined): boolean {
  return role === 'COORDINATOR' || role === 'ADMINISTRATOR';
}
