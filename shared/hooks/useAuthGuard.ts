// ─────────────────────────────────────────────
//  shared/hooks/useAuthGuard.ts
//  Protege un layout de rol (admin/instructor/coordinador/aprendiz):
//  si no hay sesión, redirige a login SOLO cuando el router raíz ya
//  terminó de montar (useRootNavigationState) y SOLO dentro de un
//  efecto — nunca durante el render.
//
//  Por qué existe: llamar a router.replace() directamente en el
//  cuerpo del render (como hacían antes estos layouts) o en un
//  efecto que se dispara antes de que expo-router esté listo,
//  produce el error "Attempted to navigate before mounting the Root
//  Layout component" al recargar una ruta profunda, y puede volver a
//  dispararse en cualquier re-render (cambiar tema/idioma, login,
//  etc.), ya que cada re-render reevalúa esa condición.
// ─────────────────────────────────────────────
import { router, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';

export function useAuthGuard(isAuthenticated: boolean, redirectTo: string = '/auth/login') {
  const rootNavigationState = useRootNavigationState();
  const isReady = !!rootNavigationState?.key;
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isReady) return; // el router raíz todavía no montó — no navegar aún
    if (!isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace(redirectTo as any);
    }
    if (isAuthenticated) hasRedirected.current = false;
  }, [isReady, isAuthenticated, redirectTo]);

  // El layout puede renderizar su contenido normal solo cuando el
  // router está listo Y hay sesión activa.
  return { canRenderContent: isReady && isAuthenticated, isReady };
}
