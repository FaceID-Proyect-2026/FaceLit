// ─────────────────────────────────────────────
//  shared/hooks/useRoleGuard.ts
//
//  RF-1.3 — Derechos de acceso
//  RF-1.4 — Definición de rol al iniciar sesión
//  RNF-1.4 — Control de acceso basado en roles (RBAC)
//  RNF-1.11 — Gestión segura de sesiones
//
//  Protege un layout verificando:
//    1. Que el usuario esté autenticado.
//    2. Que su rol esté en la lista de roles permitidos.
//
//  Si el usuario está autenticado pero su rol no está autorizado,
//  redirige a su propio dashboard (no a login) para evitar pantallas
//  de error confusas. Si no está autenticado, redirige a login.
//
//  Por qué separado de useAuthGuard: useAuthGuard solo verifica
//  autenticación (¿quién eres?). Este hook verifica autorización
//  (¿qué puedes hacer?). RF-1.15 exige separar estas responsabilidades.
// ─────────────────────────────────────────────
import { UserRole } from '@/shared/contexts/AuthContext';
import { logBlocked } from '@/shared/services/auditLogger';
import { isRoleAllowed } from '@/shared/utils/permissionsHelper';
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'ADMINISTRATOR':
    case 'COORDINATOR':
      return '/admin';
    case 'INSTRUCTOR':
      return '/instructor';
    case 'APPRENTICE':
      return '/apprentice';
    default:
      return '/auth/login';
  }
}

interface UseRoleGuardOptions {
  isAuthenticated: boolean;
  role: UserRole | null;
  /** Roles que tienen acceso a este layout */
  allowedRoles: UserRole[];
  /** Ruta a la que redirigir si no está autenticado (default: /auth/login) */
  loginRoute?: string;
}

interface UseRoleGuardResult {
  /** true cuando el router está listo y el usuario tiene el rol correcto */
  canRenderContent: boolean;
  isReady: boolean;
}

export function useRoleGuard({
  isAuthenticated,
  role,
  allowedRoles,
  loginRoute = '/auth/login',
}: UseRoleGuardOptions): UseRoleGuardResult {
  const rootNavigationState = useRootNavigationState();
  const isReady = !!rootNavigationState?.key;
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isReady) return;

    // Resetear el flag cuando el usuario sí tiene acceso
    if (isAuthenticated && role && isRoleAllowed(role, allowedRoles)) {
      hasRedirected.current = false;
      return;
    }

    if (hasRedirected.current) return;
    hasRedirected.current = true;

    if (!isAuthenticated) {
      // No autenticado → login
      router.replace(loginRoute as any);
      return;
    }

    // Autenticado pero rol no autorizado — RF-1.3 escenario alternativo 1.5
    if (role) {
      logBlocked('UNAUTHORIZED_ACCESS_ATTEMPT', {
        userDocument: undefined,
        userRole: role,
        detail: `Intento de acceso a área restringida. Roles permitidos: [${allowedRoles.join(', ')}]`,
      });
      // Redirigir al dashboard correspondiente a su rol real
      router.replace(getDefaultRouteForRole(role) as any);
    } else {
      // Sin rol asignado — RF-1.4 escenario alternativo 1.1
      router.replace(loginRoute as any);
    }
  }, [isReady, isAuthenticated, role, allowedRoles, loginRoute]);

  const roleAllowed = isAuthenticated && role !== null && isRoleAllowed(role, allowedRoles);
  return {
    canRenderContent: isReady && roleAllowed,
    isReady,
  };
}
