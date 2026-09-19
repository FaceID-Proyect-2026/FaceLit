// ─────────────────────────────────────────────
//  shared/contexts/AuthContext.tsx
//  Maneja sesión, rol y datos del usuario
//
//  RF-1.1 V3: acceso por número de documento + contraseña
//  RF-1.4: el sistema determina automáticamente el rol
//  RF-1.3: RBAC — cada rol accede solo a lo que le corresponde
//  RNF-1.1: seguridad de autenticación
//  RNF-1.3: protección contra intentos fallidos (contador + bloqueo)
//  RNF-1.8: auditoría de eventos de seguridad
//  RNF-1.11: sesión segura — no modificable por el usuario
//  RNF-1.13: disponibilidad — error claro si el servidor no responde
//
//  Login conectado al backend real: POST /api/auth/login
//  (ver shared/services/authService.js). El bloqueo local de intentos
//  fallidos es una primera línea de defensa en UI; el backend manda
//  la última palabra vía respuestas 401.
// ─────────────────────────────────────────────
import { initPrivacyStore } from '@/features/auth/privacyAcceptanceStore';
import { Routes } from '@/shared/constants/routes';
import { logBlocked, logFailure, logSuccess } from '@/shared/services/auditLogger';
import { login as loginRequest } from '@/shared/services/authService';
import { getToken, removeToken } from '@/shared/services/tokenStorage';
import { router } from 'expo-router';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

// ── Roles ──────────────────────────────────────
// El backend (RoleName.java) usa nombres en ESPAÑOL: APRENDIZ, INSTRUCTOR,
// COORDINADOR (no existe ADMINISTRATOR — COORDINADOR cubre ese caso).
// El resto de la app ya usa nombres en inglés internamente, así que
// traducimos una sola vez, justo al recibir el rol del backend.
export type UserRole = 'ADMINISTRATOR' | 'COORDINATOR' | 'COORDINATOR_REGISTER' | 'INSTRUCTOR' | 'APPRENTICE';

const BACKEND_TO_APP_ROLE: Record<string, UserRole> = {
  COORDINADOR: 'COORDINATOR',
  COORDINATOR_REGISTER: 'COORDINATOR_REGISTER',
  INSTRUCTOR: 'INSTRUCTOR',
  APRENDIZ: 'APPRENTICE',
};

function mapBackendRole(rawRole: string): UserRole {
  return BACKEND_TO_APP_ROLE[rawRole] ?? (rawRole as UserRole);
}

export interface User {
  id: string;
  document: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  permissions: string[];
  name?: string;
  lastname?: string;
}

export function getSystemUsers(): User[] {
  return [];
}

export type SystemUser = User;

// ── RNF-1.3: límite de intentos fallidos ──────
// Después de MAX_FAILED_ATTEMPTS intentos fallidos consecutivos para
// el mismo documento, se aplica un bloqueo temporal de LOCKOUT_MS ms.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutos

interface FailedAttemptRecord {
  count: number;
  lockedUntil: number | null; // timestamp epoch ms — null = sin bloqueo
}

// Mapa en memoria: documento → registro de intentos fallidos
// (se resetea si el servidor reinicia, pero es suficiente para el
// flujo actual con mock; cuando el backend gestione el bloqueo,
// esta lógica frontend actúa como primera línea de defensa)
const failedAttempts = new Map<string, FailedAttemptRecord>();

function getFailedRecord(document: string): FailedAttemptRecord {
  return failedAttempts.get(document) ?? { count: 0, lockedUntil: null };
}

function isLocked(document: string): boolean {
  const record = getFailedRecord(document);
  if (!record.lockedUntil) return false;
  if (Date.now() < record.lockedUntil) return true;
  // Expiró el bloqueo — limpiar
  failedAttempts.delete(document);
  return false;
}

function getLockRemainingMs(document: string): number {
  const record = getFailedRecord(document);
  if (!record.lockedUntil) return 0;
  return Math.max(0, record.lockedUntil - Date.now());
}

function recordFailedAttempt(document: string): void {
  const record = getFailedRecord(document);
  const newCount = record.count + 1;
  const lockedUntil =
    newCount >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_MS : null;
  failedAttempts.set(document, { count: newCount, lockedUntil });
}

function resetFailedAttempts(document: string): void {
  failedAttempts.delete(document);
}

// ── Context type ──────────────────────────────
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** true mientras se restaura la sesión al abrir la app */
  loading: boolean;
  role: UserRole | null;
  login: (document: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  /** true si la cuenta está bloqueada temporalmente (RNF-1.3) */
  locked?: boolean;
  /** Segundos restantes de bloqueo */
  lockRemainingSeconds?: number;
  /** true si el error es de red/servidor (no de credenciales) — la UI
   *  debe mostrarlo como banner general, no como error del campo password */
  networkError?: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  role: null,
  login: async () => ({ success: false }),
  logout: async () => {},
});

// ── Decodificadores de token ──────────────────
function decodeJwtPayload(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const str = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  for (let i = 0; i < str.length; i += 4) {
    const e1 = chars.indexOf(str[i]);
    const e2 = chars.indexOf(str[i + 1]);
    const e3 = chars.indexOf(str[i + 2]);
    const e4 = chars.indexOf(str[i + 3]);
    output += String.fromCharCode((e1 << 2) | (e2 >> 4));
    if (e3 !== 64 && e3 !== -1)
      output += String.fromCharCode(((e2 & 15) << 4) | (e3 >> 2));
    if (e4 !== 64 && e4 !== -1)
      output += String.fromCharCode(((e3 & 3) << 6) | e4);
  }
  return JSON.parse(decodeURIComponent(escape(output)));
}

function decodeStoredToken(token: string): any {
  if (token.split('.').length === 3) {
    try {
      return decodeJwtPayload(token);
    } catch {
      /* cae al mock */
    }
  }
  return JSON.parse(token);
}

function buildUserFromPayload(payload: any): User {
  if (payload.mock) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { mock, exp, password, ...user } = payload;
    return user as User;
  }
  return {
    id: payload.userId ?? payload.id,
    document: payload.document ?? '',
    email: payload.email,
    role: mapBackendRole(payload.role),
    permissions: payload.permissions ?? [],
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
}

// ── Redirección por rol ───────────────────────
// RF-1.4: el sistema determina automáticamente la pantalla según el rol
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

  // Al abrir la app: inicializar el store de privacidad y restaurar sesión
  useEffect(() => {
    (async () => {
      // RNF-1.6: cargar preferencias de privacidad desde almacenamiento
      // persistente (no en memoria volátil)
      await initPrivacyStore();

      try {
        const token = await getToken();
        if (token) {
          const payload = decodeStoredToken(token);
          const isExpired = payload.exp * 1000 < Date.now();
          if (isExpired) {
            // RNF-1.11: sesión expirada — invalidar
            await removeToken();
            logSuccess('SESSION_EXPIRED', { detail: 'Token expirado al restaurar sesión' });
          } else {
            const restoredUser = buildUserFromPayload(payload);
            setUser(restoredUser);
            // No registrar auditoría aquí — no es un login nuevo,
            // es una restauración silenciosa de sesión existente.
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

  const login = useCallback(async (document: string, password: string): Promise<LoginResult> => {
    const normalizedDocument = document.trim();

    // Bloqueo local: primera línea de defensa antes de golpear el backend.
    // El backend también bloquea (3 intentos / 15 min) — su respuesta 401
    // manda la última palabra sobre si la cuenta sigue bloqueada.
    if (isLocked(normalizedDocument)) {
      const remainingMs = getLockRemainingMs(normalizedDocument);
      logBlocked('LOGIN_FAILED', {
        userDocument: normalizedDocument,
        detail: 'Intento de inicio de sesión durante bloqueo temporal',
      });
      return {
        success: false,
        locked: true,
        lockRemainingSeconds: Math.ceil(remainingMs / 1000),
      };
    }

    try {
      // loginRequest ya guarda el JWT en tokenStorage (authService.login)
      const data = await loginRequest(normalizedDocument, password);

      const payload = decodeJwtPayload(data.token);
      const loggedUser: User = {
        id: data.userId ?? payload.userId ?? payload.id,
        document: normalizedDocument,
        email: payload.email ?? '',
        firstName: payload.firstName,
        lastName: payload.lastName,
        role: mapBackendRole(data.role ?? payload.role),
        permissions: data.permissions ?? payload.permissions ?? [],
      };

      resetFailedAttempts(normalizedDocument);
      setUser(loggedUser);
      logSuccess('LOGIN_SUCCESS', {
        userDocument: loggedUser.document,
        userRole: loggedUser.role,
      });
      redirectByRole(loggedUser.role);

      return { success: true };
    } catch (err: any) {
      const status: number = err.response?.status ?? 0;
      const backendMessage: string = err.response?.data?.message ?? '';
      const isLockedByBackend =
        status === 401 &&
        (backendMessage.toLowerCase().includes('bloque') ||
          backendMessage.toLowerCase().includes('lock'));

      recordFailedAttempt(normalizedDocument);
      const locked = isLockedByBackend || isLocked(normalizedDocument);
      const remainingMs = getLockRemainingMs(normalizedDocument);
      const audit = locked ? logBlocked : logFailure;
      audit('LOGIN_FAILED', {
        userDocument: normalizedDocument,
        detail: locked
          ? 'Cuenta bloqueada por demasiados intentos fallidos'
          : backendMessage || 'Credenciales inválidas',
      });

      if (status >= 500 || !status) {
        return {
          success: false,
          networkError: true,
          error:
            status === 0 || !status
              ? 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo y que la URL en tu .env (EXPO_PUBLIC_API_URL) sea correcta.'
              : 'El servidor respondió con un error. Intenta de nuevo más tarde.',
        };
      }

      return {
        success: false,
        locked,
        lockRemainingSeconds: locked ? Math.ceil(remainingMs / 1000) : undefined,
        error: backendMessage || 'Documento o contraseña incorrectos',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      logSuccess('LOGOUT', {
        userDocument: user.document,
        userRole: user.role,
      });
    }
    await removeToken();
    setUser(null);
    // No navegamos aquí: los layouts de cada rol (useRoleGuard) detectan
    // isAuthenticated=false y redirigen a login ellos mismos, una vez el
    // router raíz ya está listo. Navegar aquí directamente corría el
    // riesgo de hacerlo antes de que React confirmara el nuevo estado.
  }, [user]);

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

