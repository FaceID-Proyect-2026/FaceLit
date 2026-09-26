export type FacialStatus = "registered" | "pending" | "failed";
export type FacialRole = "administrador" | "instructor" | "aprendiz";

export interface FacialRecord {
  id: string;
  userId: string;
  userName: string;
  status: FacialStatus;
  date: string;
  captureUri?: string;
}

export interface FacialUser {
  id: string;
  name: string;
  role: FacialRole;
  fichaId?: string;
  fichaNumber?: string;
}

export interface FacialConfig {
  environmentId: string;
  environmentName: string;
  instructorId: string;
  instructorName: string;
  fichaId: string;
  fichaNumber: string | number;
}

export interface FacialSettings {
  registrationMinutes: number;
  exitTime: string;
  shutdownTime: string;
}

// Estructura lista para el módulo de asistencias. El reconocimiento no crea
// asistencia por sí mismo: entrega un evento completo para que el proceso de
// validación de asistencia decida cómo registrarlo.
export interface FacialEvent {
  id: string;
  userId: string;
  environmentId: string;
  fichaId: string;
  occurredAt: string;
  type: "entry" | "exit";
}

export const VALID_FACIAL_ROLES: FacialRole[] = [
  "administrador",
  "instructor",
  "aprendiz",
];

export const DEFAULT_FACIAL_SETTINGS: FacialSettings = {
  registrationMinutes: 5,
  exitTime: "17:00",
  shutdownTime: "18:00",
};

export const FACIAL_REGISTRATION_MINUTES_OPTIONS = [1, 3, 5, 10, 15];
export const FACIAL_TIME_SLOTS = Array.from({ length: 25 }, (_, index) => {
  const hour = Math.floor(index / 2) + 6;
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${String(hour).padStart(2, "0")}:${minutes}`;
});

export const MOCK_FACIAL_RECORDS: FacialRecord[] = [
  {
    id: "f1",
    userId: "l1",
    userName: "Juan Pérez",
    status: "registered",
    date: "2026-06-01",
    captureUri: "registered://l1",
  },
  {
    id: "f2",
    userId: "2",
    userName: "María González",
    status: "registered",
    date: "2026-06-02",
    captureUri: "registered://2",
  },
];
