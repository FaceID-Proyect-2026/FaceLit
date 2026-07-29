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

export const VALID_FACIAL_ROLES: FacialRole[] = ['administrador', 'instructor', 'aprendiz'];

export const MOCK_FACIAL_RECORDS: FacialRecord[] = [
  { id: 'f1', userId: 'l1', userName: 'Juan Pérez', status: 'registered', date: '2026-06-01', captureUri: 'registered://l1' },
  { id: 'f2', userId: '2', userName: 'María González', status: 'registered', date: '2026-06-02', captureUri: 'registered://2' },
];
