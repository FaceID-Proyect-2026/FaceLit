import AsyncStorage from "@react-native-async-storage/async-storage";
import { pushNotification } from "../notifications/notificationsStore";
import {
    DEFAULT_FACIAL_SETTINGS,
    FacialConfig,
    FacialEvent,
    FacialRecord,
    FacialSettings,
    FacialUser,
    MOCK_FACIAL_RECORDS,
    VALID_FACIAL_ROLES,
} from "./types";

type Listener = () => void;
type RegistrationResult =
  | { success: true; record: FacialRecord }
  | { success: false; error: string };

let records: FacialRecord[] = MOCK_FACIAL_RECORDS;
let events: FacialEvent[] = [];
let config: FacialConfig | undefined;
let settings: FacialSettings = DEFAULT_FACIAL_SETTINGS;
const listeners = new Set<Listener>();
const FACIAL_CONFIG_STORAGE_KEY = "facial:instructor:config";
const FACIAL_SETTINGS_STORAGE_KEY = "facial:instructor:settings";
let configHydrated = false;
let configHydrationPromise: Promise<void> | null = null;
let settingsHydrated = false;
let settingsHydrationPromise: Promise<void> | null = null;

const emit = () => listeners.forEach((listener) => listener());

const isValidConfig = (value: unknown): value is FacialConfig => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FacialConfig>;
  return (
    typeof candidate.environmentId === "string" &&
    candidate.environmentId.length > 0 &&
    typeof candidate.environmentName === "string" &&
    candidate.environmentName.length > 0 &&
    typeof candidate.instructorId === "string" &&
    candidate.instructorId.length > 0 &&
    typeof candidate.instructorName === "string" &&
    candidate.instructorName.length > 0 &&
    typeof candidate.fichaId === "string" &&
    candidate.fichaId.length > 0 &&
    (typeof candidate.fichaNumber === "string" ||
      typeof candidate.fichaNumber === "number")
  );
};

const isValidSettings = (value: unknown): value is FacialSettings => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FacialSettings>;
  return (
    typeof candidate.registrationMinutes === "number" &&
    Number.isFinite(candidate.registrationMinutes) &&
    typeof candidate.exitTime === "string" &&
    candidate.exitTime.length > 0 &&
    typeof candidate.shutdownTime === "string" &&
    candidate.shutdownTime.length > 0
  );
};

export function hydrateFacialConfig() {
  if (configHydrated) return Promise.resolve();
  if (configHydrationPromise) return configHydrationPromise;

  configHydrationPromise = AsyncStorage.getItem(FACIAL_CONFIG_STORAGE_KEY)
    .then((storedConfig) => {
      if (!storedConfig) return;
      const parsed = JSON.parse(storedConfig);
      if (isValidConfig(parsed)) {
        config = parsed;
        emit();
      }
    })
    .catch((error) => {
      console.warn("[FacialConfig] No se pudo cargar la configuracion guardada:", error);
    })
    .finally(() => {
      configHydrated = true;
      configHydrationPromise = null;
    });

  return configHydrationPromise;
}

export function hydrateFacialSettings() {
  if (settingsHydrated) return Promise.resolve();
  if (settingsHydrationPromise) return settingsHydrationPromise;

  settingsHydrationPromise = AsyncStorage.getItem(FACIAL_SETTINGS_STORAGE_KEY)
    .then((storedSettings) => {
      if (!storedSettings) return;
      const parsed = JSON.parse(storedSettings);
      if (isValidSettings(parsed)) {
        settings = parsed;
        emit();
      }
    })
    .catch((error) => {
      console.warn("[FacialSettings] No se pudo cargar la configuracion guardada:", error);
    })
    .finally(() => {
      settingsHydrated = true;
      settingsHydrationPromise = null;
    });

  return settingsHydrationPromise;
}

export function subscribeFacial(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFacialRecordsSnapshot() {
  return records;
}
export function getFacialEventsSnapshot() {
  return events;
}
export function getFacialConfigSnapshot() {
  return config;
}
export function getFacialSettingsSnapshot() {
  return settings;
}

type FacialSaveResult = { success: true } | { success: false; error: string };

export function saveFacialConfig(nextConfig: FacialConfig): Promise<FacialSaveResult> {
  config = nextConfig;
  emit();
  return AsyncStorage.setItem(
    FACIAL_CONFIG_STORAGE_KEY,
    JSON.stringify(nextConfig),
  )
    .then(() => ({ success: true as const }))
    .catch((error) => {
      console.warn("[FacialConfig] No se pudo guardar la configuracion:", error);
      return { success: false as const, error: "facial.setup.validation.saveFailed" };
    });
}

export function saveFacialSettings(
  nextSettings: FacialSettings,
): Promise<FacialSaveResult> {
  settings = nextSettings;
  emit();
  return AsyncStorage.setItem(
    FACIAL_SETTINGS_STORAGE_KEY,
    JSON.stringify(nextSettings),
  )
    .then(() => ({ success: true as const }))
    .catch((error) => {
      console.warn("[FacialSettings] No se pudo guardar la configuracion:", error);
      return { success: false as const, error: "facial.settings.saveError" };
    });
}

export function registerFacialCapture(
  user: FacialUser | undefined,
  captureUri: string | null,
  trainingSucceeded = true,
  replaceExisting = false,
): RegistrationResult {
  if (!user) return { success: false, error: "facial.validation.userNotFound" };
  if (!VALID_FACIAL_ROLES.includes(user.role))
    return { success: false, error: "facial.validation.invalidRole" };
  if (!captureUri) return { success: false, error: "facial.validation.noFace" };
  if (!trainingSucceeded)
    return { success: false, error: "facial.validation.trainingFailed" };
  if (
    !replaceExisting &&
    records.some(
      (record) => record.userId === user.id && record.status === "registered",
    )
  ) {
    return { success: false, error: "facial.validation.alreadyRegistered" };
  }

  const record: FacialRecord = {
    id: `face-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    status: "registered",
    date: new Date().toISOString().slice(0, 10),
    captureUri,
  };
  records = [...records.filter((item) => item.userId !== user.id), record];
  emit();
  return { success: true, record };
}

export function registerFacialEvent(
  event: Omit<FacialEvent, "id" | "occurredAt"> & { occurredAt?: string },
) {
  const facialEvent: FacialEvent = {
    id: `event-${Date.now()}`,
    ...event,
    occurredAt: event.occurredAt ?? new Date().toISOString(),
  };
  events = [...events, facialEvent];
  emit();
  return facialEvent;
}

// ── RF-8.4 — Solicitud de re-registro facial ──────────────────────────────────
// El aprendiz toca "Solicitar registro nuevamente" y esto genera una
// notificación con botones Aceptar/Rechazar que el Coordinador resuelve
// directamente desde su bandeja de notificaciones.
export function requestFacialReRegistration(user: FacialUser): void {
  pushNotification(
    "facial_reregister_request",
    "Solicitud de re-registro facial",
    `${user.name} (ID: ${user.id}) solicita volver a registrar su rostro.`,
    {
      requestId: `req-${Date.now()}`,
      facialUserId: user.id,
      learnerName: user.name,
    },
  );
}
