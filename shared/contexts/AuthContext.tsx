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
//  El login actual usa DATOS QUEMADOS (mock) mientras el backend
//  actualiza el endpoint /api/auth/login para aceptar documento.
//  Cuando esté listo, reemplazar solo el cuerpo de login() con la
//  llamada real — el resto de la app no cambia.
// ─────────────────────────────────────────────
import { initPrivacyStore } from '@/features/auth/privacyAcceptanceStore';
import { pushNotification } from '@/features/notifications/notificationsStore';
import { Routes } from '@/shared/constants/routes';
import { logBlocked, logFailure, logSuccess } from '@/shared/services/auditLogger';
import { getToken, removeToken, saveToken } from '@/shared/services/tokenStorage';
import { router } from 'expo-router';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// ── Tipos ─────────────────────────────────────
// Los roles vienen del backend en MAYÚSCULAS (ver SecurityConfig.java)
// Los roles vienen del backend en MAYÚSCULAS (ver SecurityConfig.java)
export type UserRole = 'ADMINISTRATOR' | 'COORDINATOR' | 'INSTRUCTOR' | 'APPRENTICE';

export interface User {
  id: string;
  document: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  permissions: string[];
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  role: null,
  login: async () => ({ success: false }),
  logout: async () => {},
});

// ── Dato quemado (mock) ───────────────────────
// RF-3 (Gestión Académica) es quien en el futuro alimenta la lista
// real. Por ahora son cuentas fijas para probar RF-1 sin backend.
interface MockAccount extends User {
  password: string;
}

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'u-admin-1',
    document: '1000000001',
    password: 'Admin123!',
    email: 'admin@facelit.test',
    firstName: 'Laura',
    lastName: 'Restrepo',
    role: 'ADMINISTRATOR',
    permissions: ['*'],
  },
  {
    id: 'u-coord-1',
    document: '1000000002',
    password: 'Coord123!',
    email: 'coordinador@facelit.test',
    firstName: 'Camilo',
    lastName: 'Vargas',
    role: 'COORDINATOR',
    permissions: ['*'],
  },
  {
    id: 'u-inst-1',
    document: '1000000003',
    password: 'Inst123!',
    email: 'maria.gonzalez@facelit.test',
    firstName: 'María',
    lastName: 'González',
    role: 'INSTRUCTOR',
    permissions: [],
  },
  {
    id: 'u-appr-1',
    document: '1000000004',
    password: 'Apr123!',
    email: 'juan.perez@facelit.test',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: 'APPRENTICE',
    permissions: [],
  },
];

// ── Correos mock registrados para el flujo de recovery ───
// Cuando el backend esté listo, esta lista no se necesita más.
// Permite probar password-recovery → verify-identity → new-password
// con datos quemados sin llamar al servidor.
// Contraseña para testing: Admin123! (doc 1000000001)
const MOCK_RECOVERY_EMAILS: Record<string, string> = {
  'admin@facelit.test':          '1000000001',
  'coordinador@facelit.test':    '1000000002',
  'maria.gonzalez@facelit.test': '1000000003',
  'juan.perez@facelit.test':     '1000000004',
};

// El "token" mock — se distingue de un JWT real por no tener 3 partes
// separadas por ".". Cuando el backend esté listo, guardará un JWT
// legítimo y la rama de decodificación real se activará sola.
function buildMockToken(user: User): string {
  return JSON.stringify({
    mock: true,
    ...user,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 días
  });
}

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
    role: payload.role,
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

  const login = useCallback(
    async (document: string, password: string): Promise<LoginResult> => {
      const cleanDocument = document.trim();

      // ── RNF-1.3: verificar bloqueo por intentos fallidos ──
      if (isLocked(cleanDocument)) {
        const remaining = Math.ceil(getLockRemainingMs(cleanDocument) / 1000);
        logBlocked('LOGIN_FAILED', {
          userDocument: cleanDocument,
          detail: `Cuenta bloqueada. Intentos fallidos: ${MAX_FAILED_ATTEMPTS}. Segundos restantes: ${remaining}`,
        });
        return {
          success: false,
          locked: true,
          lockRemainingSeconds: remaining,
          error: `Cuenta bloqueada temporalmente. Intenta en ${remaining} segundos.`,
        };
      }

      // ── Mock (RF-1.1 V3 — mientras el backend acepta documento) ──
      // Simula latencia real para que el reemplazo sea transparente.
      await new Promise((resolve) => setTimeout(resolve, 400));

      // 1. Buscar en cuentas fijas (admin, coordinador, instructor mock, aprendiz mock)
      const account = MOCK_ACCOUNTS.find(
        (item) => item.document === cleanDocument,
      );

      if (account) {
        if (account.password !== password) {
          recordFailedAttempt(cleanDocument);
          const record = getFailedRecord(cleanDocument);
          const attemptsLeft = MAX_FAILED_ATTEMPTS - record.count;
          logFailure('LOGIN_FAILED', {
            userDocument: cleanDocument,
            userRole: account.role,
            detail: `Contraseña incorrecta. Intentos restantes: ${Math.max(0, attemptsLeft)}`,
          });
          if (attemptsLeft <= 0) {
            // RF-8 — Notificación #15: cuenta bloqueada
            pushNotification(
              'security_account_locked',
              'Cuenta bloqueada por intentos fallidos',
              `La cuenta con documento ${cleanDocument} quedó bloqueada por ${Math.ceil(LOCKOUT_MS / 60000)} minutos tras superar el límite de intentos fallidos.`,
              { accountDocument: cleanDocument, failedCount: MAX_FAILED_ATTEMPTS, lockMinutes: Math.ceil(LOCKOUT_MS / 60000) },
            );
            return {
              success: false,
              locked: true,
              lockRemainingSeconds: Math.ceil(LOCKOUT_MS / 1000),
              error: `Demasiados intentos fallidos. Cuenta bloqueada por ${Math.ceil(LOCKOUT_MS / 60000)} minutos.`,
            };
          }
          // RF-8 — Notificación #14: múltiples intentos fallidos (a partir del 3er intento)
          if (record.count >= 3) {
            pushNotification(
              'security_multiple_failures',
              'Múltiples intentos fallidos de sesión',
              `La cuenta con documento ${cleanDocument} acumuló ${record.count} intentos fallidos consecutivos de inicio de sesión.`,
              { accountDocument: cleanDocument, failedCount: record.count },
            );
          }
          return { success: false, error: 'Documento o contraseña incorrectos' };
        }

        resetFailedAttempts(cleanDocument);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _pw, ...loggedUser } = account;
        await saveToken(buildMockToken(loggedUser));
        setUser(loggedUser);
        logSuccess('LOGIN_SUCCESS', { userDocument: loggedUser.document, userRole: loggedUser.role });
        redirectByRole(loggedUser.role);
        return { success: true };
      }

      // 2. Buscar en aprendices e instructores creados por CSV / manualmente
      //    Valida contra su contraseña inicial (generada por el sistema).
      //    Import lazy para evitar dependencia circular con el store académico.
      let storeUser: User | null = null;
      let storePassword: string | null = null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const academicStore = require('@/features/academic/academicStore');

        // Buscar en fichas → learners
        outer: for (const ficha of academicStore.getFichasSnapshot()) {
          for (const learner of ficha.learners) {
            if (learner.document === cleanDocument && learner.initialPassword) {
              storeUser = {
                id: learner.id,
                document: learner.document,
                email: learner.email,
                firstName: learner.name,
                lastName: learner.lastname,
                role: 'APPRENTICE' as UserRole,
                permissions: [],
              };
              storePassword = learner.initialPassword;
              break outer;
            }
          }
        }

        // Si no se encontró como aprendiz, buscar en instructores
        if (!storeUser) {
          for (const inst of academicStore.getInstructorsSnapshot()) {
            if (inst.document === cleanDocument && inst.initialPassword) {
              storeUser = {
                id: inst.id,
                document: inst.document,
                email: inst.email,
                firstName: inst.name,
                lastName: inst.lastname,
                role: 'INSTRUCTOR' as UserRole,
                permissions: [],
              };
              storePassword = inst.initialPassword;
              break;
            }
          }
        }
      } catch {
        // Si el store académico no está disponible, continuar sin él
      }


      if (!storeUser || !storePassword) {
        recordFailedAttempt(cleanDocument);
        logFailure('LOGIN_FAILED', { userDocument: cleanDocument, detail: 'Documento no registrado' });
        return { success: false, error: 'Documento o contraseña incorrectos' };
      }

      if (storePassword !== password) {
        recordFailedAttempt(cleanDocument);
        const record = getFailedRecord(cleanDocument);
        const attemptsLeft = MAX_FAILED_ATTEMPTS - record.count;
        logFailure('LOGIN_FAILED', {
          userDocument: cleanDocument,
          userRole: storeUser.role,
          detail: `Contraseña incorrecta. Intentos restantes: ${Math.max(0, attemptsLeft)}`,
        });
        if (attemptsLeft <= 0) {
          // RF-8 — Notificación #15
          pushNotification(
            'security_account_locked',
            'Cuenta bloqueada por intentos fallidos',
            `La cuenta con documento ${cleanDocument} quedó bloqueada por ${Math.ceil(LOCKOUT_MS / 60000)} minutos tras superar el límite de intentos fallidos.`,
            { accountDocument: cleanDocument, failedCount: MAX_FAILED_ATTEMPTS, lockMinutes: Math.ceil(LOCKOUT_MS / 60000) },
          );
          return {
            success: false,
            locked: true,
            lockRemainingSeconds: Math.ceil(LOCKOUT_MS / 1000),
            error: `Demasiados intentos fallidos. Cuenta bloqueada por ${Math.ceil(LOCKOUT_MS / 60000)} minutos.`,
          };
        }
        // RF-8 — Notificación #14
        if (record.count >= 3) {
          pushNotification(
            'security_multiple_failures',
            'Múltiples intentos fallidos de sesión',
            `La cuenta con documento ${cleanDocument} acumuló ${record.count} intentos fallidos consecutivos de inicio de sesión.`,
            { accountDocument: cleanDocument, failedCount: record.count },
          );
        }
        return { success: false, error: 'Documento o contraseña incorrectos' };
      }

      resetFailedAttempts(cleanDocument);
      await saveToken(buildMockToken(storeUser));
      setUser(storeUser);
      logSuccess('LOGIN_SUCCESS', { userDocument: storeUser.document, userRole: storeUser.role });
      redirectByRole(storeUser.role);
      return { success: true };

      /* ── Cuando el backend acepte documento, reemplazar desde el
         mock hasta el return de éxito por:

      try {
        const { data } = await api.post('/api/auth/login', {
          documento: cleanDocument,
          password,
          aceptoPoliticas: true,
        });
        resetFailedAttempts(cleanDocument);
        await saveToken(data.token);
        const loggedUser: User = {
          id: data.userId,
          document: cleanDocument,
          email: data.email,
          role: data.role,
          permissions: data.permissions ?? [],
          firstName: data.firstName,
          lastName: data.lastName,
        };
        setUser(loggedUser);
        logSuccess('LOGIN_SUCCESS', { userDocument: cleanDocument, userRole: data.role });
        redirectByRole(data.role);
        return { success: true };
      } catch (error: any) {
        recordFailedAttempt(cleanDocument);
        logFailure('LOGIN_FAILED', { userDocument: cleanDocument, detail: error?.response?.data?.message });
        const message = error.response?.data?.message || 'No se pudo conectar con el servidor';
        return { success: false, error: message };
      }
      */
    },
    [],
  );

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
