// ─────────────────────────────────────────────
//  shared/contexts/AuthContext.tsx
//  Maneja sesión, rol y datos del usuario
// ─────────────────────────────────────────────
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { router } from 'expo-router';
import { Routes } from '@/shared/constants/routes';

// ── Tipos ─────────────────────────────────────
export type UserRole = 'administrador' | 'instructor' | 'aprendiz';

export interface User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  documentType: string;
  document: string;
  role: UserRole;
  status: 'active' | 'inactive';
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

// ── Usuarios mock ─────────────────────────────
const MOCK_USERS: Record<string, { user: User; password: string }> = {
  'admin@facelit.com': {
    password: 'Admin123!',
    user: {
      id: '1',
      name: 'Carlos',
      lastname: 'Rodríguez',
      email: 'admin@facelit.com',
      documentType: 'CC',
      document: '1234567890',
      role: 'administrador',
      status: 'active',
    },
  },
  'instructor@facelit.com': {
    password: 'Inst1234!',
    user: {
      id: '2',
      name: 'María',
      lastname: 'González',
      email: 'instructor@facelit.com',
      documentType: 'CC',
      document: '0987654321',
      role: 'instructor',
      status: 'active',
    },
  },
  'aprendiz@facelit.com': {
    password: 'Apre1234!',
    user: {
      id: '3',
      name: 'Juan',
      lastname: 'Pérez',
      email: 'aprendiz@facelit.com',
      documentType: 'TI',
      document: '1122334455',
      role: 'aprendiz',
      status: 'active',
    },
  },
};

// ── Contexto ──────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  role: null,
  login: async () => ({ success: false }),
  logout: () => {},
  updateUser: () => {},
});

// ── Provider ──────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const entry = MOCK_USERS[email.toLowerCase().trim()];
    
    if (!entry) {
      return { success: false, error: 'Correo electrónico no registrado' };
    }
    
    if (entry.password !== password) {
      return { success: false, error: 'Contraseña incorrecta' };
    }
    
    if (entry.user.status !== 'active') {
      return { success: false, error: 'Tu cuenta está inactiva. Contacta a un administrador.' };
    }
    
    setUser(entry.user);
    
    // Redirigir según rol
    if (entry.user.role === 'administrador') {
      router.replace(Routes.ADMIN.DASHBOARD as any);
    } else if (entry.user.role === 'instructor') {
      router.replace('/instructor' as any);
    } else {
      router.replace('/apprentice' as any);
    }
    
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    router.replace(Routes.AUTH.LOGIN as any);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        role: user?.role ?? null,
        login,
        logout,
        updateUser,
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
