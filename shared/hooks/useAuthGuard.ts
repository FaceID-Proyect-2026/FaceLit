// ─────────────────────────────────────────────
//  shared/hooks/useAuthGuard.ts
//  Protege un layout de rol (admin/instructor/apprentice):
//  si no hay sesión, redirige a login SOLO cuando:
//    1. El router raíz ya terminó de montar (useRootNavigationState)
//    2. La sesión ya terminó de restaurarse (authLoading = false)
//    3. Todo ocurre dentro de un efecto, nunca durante el render
//
//  Acepta un tercer parámetro `authLoading` para no redirigir
//  mientras AuthContext está restaurando la sesión desde el token
//  guardado (ese proceso es asíncrono y tarda ~100-400 ms).
// ─────────────────────────────────────────────
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

export function useAuthGuard(
  isAuthenticated: boolean,
  redirectTo: string = '/auth/login',
  authLoading: boolean = false,
) {
  const rootNavigationState = useRootNavigationState();
  const isReady = !!rootNavigationState?.key;
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Esperar a que el router esté listo Y la sesión haya terminado de cargarse
    if (!isReady || authLoading) return;

    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo as any);
    }
    if (isAuthenticated) hasRedirected.current = false;
  }, [isReady, authLoading, isAuthenticated, redirectTo]);

  // Solo renderizar contenido cuando el router está listo,
  // la sesión terminó de cargarse Y el usuario está autenticado.
  return {
    canRenderContent: isReady && !authLoading && isAuthenticated,
    isReady,
  };
}
