// ─────────────────────────────────────────────
//  shared/contexts/AuthContext.tsx
//  Maneja sesión, rol y datos del usuario
//  Conectado al backend real (Spring Boot)
// ─────────────────────────────────────────────
import { Routes } from '@/shared/constants/routes';
import { api } from '@/shared/services/api';
import { getToken, removeToken, saveToken } from '@/shared/services/tokenStorage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// ── Tipos ─────────────────────────────────────
// Los roles vienen del backend en MAYÚSCULAS (ver SecurityConfig.java)
export type UserRole = 'ADMINISTRATOR' | 'COORDINATOR' | 'INSTRUCTOR' | 'APPRENTICE';

export interface User {
  id: string;
  email: string;
  firstName?: string;   // ← agregar
  lastName?: string;    // ← agregar
  role: UserRole;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean; // true mientras se restaura la sesión al abrir la app
  role: UserRole | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  role: null,
  login: async () => ({ success: false }),
  logout: async () => { },
});

// ── Helper: decodificar el payload del JWT ────
// Un JWT tiene 3 partes separadas por ".": header.payload.signature
// El payload viene en Base64Url — lo decodificamos manualmente
// porque atob() no siempre está disponible en React Native.
function decodeJwtPayload(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let str = base64.replace(/[^A-Za-z0-9+/=]/g, '');

  for (let i = 0; i < str.length; i += 4) {
    const enc1 = chars.indexOf(str.charAt(i));
    const enc2 = chars.indexOf(str.charAt(i + 1));
    const enc3 = chars.indexOf(str.charAt(i + 2));
    const enc4 = chars.indexOf(str.charAt(i + 3));

    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;

    output += String.fromCharCode(chr1);
    if (enc3 !== 64 && enc3 !== -1) output += String.fromCharCode(chr2);
    if (enc4 !== 64 && enc4 !== -1) output += String.fromCharCode(chr3);
  }

  return JSON.parse(decodeURIComponent(escape(output)));
}

function buildUserFromToken(token: string): User {
  const payload = decodeJwtPayload(token);
  return {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions ?? [],
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
}

function redirectByRole(role: UserRole) {
  switch (role) {
    case 'ADMINISTRATOR':
    case 'COORDINATOR':
      router.replace(Routes.ADMIN.DASHBOARD as any);
      break;
    case 'INSTRUCTOR':
      router.replace('/instructor' as any);
      break;
    case 'APPRENTICE':
      router.replace('/apprentice' as any);
      break;
  }
}

// ── Provider ──────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la app: si hay un token guardado, restaurar la sesión
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const restoredUser = buildUserFromToken(token);

          // Verificar que no esté expirado (exp viene en segundos, Date.now() en ms)
          const payload = decodeJwtPayload(token);
          const isExpired = payload.exp * 1000 < Date.now();

          if (isExpired) {
            await removeToken();
          } else {
            setUser(restoredUser);
          }
        }
      } catch (e) {
        console.warn('No se pudo restaurar la sesión:', e);
        await removeToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/api/auth/login', {
        email,
        password,
        aceptoPoliticas: true,
      });

      await saveToken(data.token);

      const loggedUser: User = {
        id: data.userId,
        email,
        role: data.role,
        permissions: data.permissions,
      };
      setUser(loggedUser);
      redirectByRole(data.role);

      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'No se pudo conectar con el servidor';
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setUser(null);
    router.replace(Routes.AUTH.LOGIN as any);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        loading,
        role: user?.role ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}