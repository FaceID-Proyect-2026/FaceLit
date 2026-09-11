export type FacialStatus = 'registered' | 'pending' | 'failed';
export type FacialRole = 'administrador' | 'instructor' | 'aprendiz';

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

// Estructura lista para el módulo de asistencias. El reconocimiento no crea
// asistencia por sí mismo: entrega un evento completo para que el proceso de
// validación de asistencia decida cómo registrarlo.
export interface FacialEvent {
  id: string;
  userId: string;
  environmentId: string;
  fichaId: string;
  occurredAt: string;
  type: 'entry' | 'exit';
}

// Configuración de una sesión de reconocimiento facial: ambiente donde se
// hará la captura, instructor a cargo y ficha de los aprendices esperados.
export interface FacialSessionConfig {
  id: string;
  environmentId: string;
  environmentName: string;
  instructorId: string;
  instructorName: string;
  fichaId: string;
  fichaNumber: string;
  updatedAt: string;
}

// Ajustes operativos de la jornada de reconocimiento facial (independientes
// de la sesión Ambiente/Instructor/Ficha). Se editan desde el botón "Ajustes"
// de la pantalla de configuración de reconocimiento facial.
export interface FacialRecognitionSettings {
  registrationMinutes: number; // minutos que dura la ventana de registro de rostro, ej. 5
  exitTime: string;            // hora de salida en formato 24h "HH:MM", ej. "11:45"
  shutdownTime: string;        // hora de apagado del punto de reconocimiento en formato 24h "HH:MM", ej. "12:00"
}

// Valores por defecto centralizados (evita números mágicos dispersos en la UI).
export const DEFAULT_FACIAL_SETTINGS: FacialRecognitionSettings = {
  registrationMinutes: 5,
  exitTime: '11:45',
  shutdownTime: '12:00',
};

// Opciones fijas de duración del registro. Se usan con SelectField, siguiendo
// el mismo criterio que TIME_SLOTS en el módulo de horarios: una lista fija
// evita estados inválidos por texto libre mal formado.
export const FACIAL_REGISTRATION_MINUTES_OPTIONS: number[] = [1, 2, 3, 5, 10, 15, 20, 30];

// Franjas horarias de 15 minutos cubriendo el día completo (00:00–23:45),
// para "hora de salida" y "hora de apagado".
export const FACIAL_TIME_SLOTS: string[] = Array.from({ length: 96 }, (_, i) => {
  const totalMinutes = i * 15;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
});

export const VALID_FACIAL_ROLES: FacialRole[] = ['administrador', 'instructor', 'aprendiz'];

export const MOCK_FACIAL_RECORDS: FacialRecord[] = [
  { id: 'f1', userId: 'l1', userName: 'Juan Pérez', status: 'registered', date: '2026-06-01', captureUri: 'registered://l1' },
  { id: 'f2', userId: '2', userName: 'María González', status: 'registered', date: '2026-06-02', captureUri: 'registered://2' },
];
