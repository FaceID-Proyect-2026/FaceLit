// ─────────────────────────────────────────────
//  features/auth/privacyAcceptanceStore.ts
//
//  RF-1.1 V3 — Aviso de privacidad (Ley 1581/2012)
//  RNF-1.6 — Protección de datos personales
//
//  Registra qué números de documento ya aceptaron el aviso de
//  privacidad, de modo que el login no lo vuelva a pedir.
//
//  Persistencia: AsyncStorage (sobrevive al cierre de la app).
//  Fallback a memoria si AsyncStorage no está disponible.
//
//  La clave en AsyncStorage es "privacy_accepted_documents" y guarda
//  un array JSON de strings. Nunca se almacena información sensible
//  (contraseñas, tokens) — solo el número de documento como
//  identificador de aceptación.
// ─────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'privacy_accepted_documents';

// Cache en memoria para lecturas síncronas (se carga al inicializar)
let _cache: Set<string> = new Set();
let _initialized = false;

function normalize(document: string): string {
  return document.trim();
}

// Carga el cache desde AsyncStorage una sola vez
async function ensureInitialized(): Promise<void> {
  if (_initialized) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      _cache = new Set(parsed);
    }
  } catch {
    // Si falla la lectura, continuar con el cache vacío en memoria
  } finally {
    _initialized = true;
  }
}

// Persiste el cache completo en AsyncStorage
async function persistCache(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([..._cache]));
  } catch {
    // No lanzar — la aceptación en memoria sigue funcionando
  }
}

/**
 * Comprueba si el documento ya tiene una aceptación registrada.
 * Versión síncrona (usa el cache en memoria).
 * Para garantizar que el cache está cargado, llamar a
 * initPrivacyStore() al inicio de la app.
 */
export function hasAcceptedPrivacy(document: string): boolean {
  if (!document.trim()) return false;
  return _cache.has(normalize(document));
}

/**
 * Registra la aceptación del documento dado (persiste en AsyncStorage).
 */
export async function recordPrivacyAcceptance(document: string): Promise<void> {
  if (!document.trim()) return;
  const key = normalize(document);
  if (_cache.has(key)) return; // ya registrado — no reescribir
  _cache.add(key);
  await persistCache();
}

/**
 * Inicializa el store cargando los datos desde AsyncStorage.
 * Llamar una vez al arranque de la app (en AuthProvider o _layout.tsx).
 */
export async function initPrivacyStore(): Promise<void> {
  await ensureInitialized();
}
