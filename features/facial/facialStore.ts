import { pushNotification } from "../notifications/notificationsStore";
import {
    DEFAULT_FACIAL_SETTINGS,
    FacialConfig,
    FacialEvent,
    FacialRecord,
    FacialSettings,
    FacialUser,
    MOCK_FACIAL_RECORDS,
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

const emit = () => listeners.forEach((listener) => listener());

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

export function saveFacialConfig(nextConfig: FacialConfig): FacialSaveResult {
  config = nextConfig;
  emit();
  return { success: true as const };
}

export function saveFacialSettings(
  nextSettings: FacialSettings,
): FacialSaveResult {
  settings = nextSettings;
  emit();
  return { success: true as const };
}

export function registerFacialCapture(
  _user: FacialUser | undefined,
  _captureUri: string | null,
  _trainingSucceeded = false,
): RegistrationResult {
  // A local photograph cannot issue a trusted PAD verdict.
  // Registration must use the authenticated /api/facial/enrollment route.
  return { success: false, error: "facial.validation.trainingFailed" };
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
