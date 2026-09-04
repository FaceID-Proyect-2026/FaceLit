// ─────────────────────────────────────────────
//  features/environments/types.ts
//  Tipos del módulo de ambientes
// ─────────────────────────────────────────────

export type EnvironmentStatus = 'active' | 'inactive';

export interface Environment {
  id: string;
  code: string; // Nombre del ambiente. Ej: "209", "209-1", "Laboratorio A"
  status: EnvironmentStatus;
  quantity: number;
  assignedFichas: AssignedFicha[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignedFicha {
  fichaCode: string;
  assignedAt: string;
  unassignedAt?: string;
}

export interface EnvironmentForm {
  code: string;
  status?: EnvironmentStatus;
  quantity?: number;
}

// El nombre del ambiente admite letras, números, espacios y guiones.
// Ej: "209", "209-1", "Laboratorio A", "Sala 2"
export const ENVIRONMENT_NAME_REGEX = /^[\p{L}0-9][\p{L}0-9\s-]*$/u;

// Cantidad máxima de aprendices permitida en un ambiente.
export const MAX_ENVIRONMENT_QUANTITY = 50;

export const MOCK_ENVIRONMENTS: Environment[] = [
  { id: '1', code: '101-1', status: 'active', quantity: 25, assignedFichas: [{ fichaCode: '3145555', assignedAt: '2026-09-01T10:00:00.000Z' }], createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z' },
  { id: '2', code: '102-1', status: 'active', quantity: 20, assignedFichas: [], createdAt: '2026-09-02T10:00:00.000Z', updatedAt: '2026-09-02T10:00:00.000Z' },
  { id: '3', code: '201-2', status: 'active', quantity: 30, assignedFichas: [{ fichaCode: '3145556', assignedAt: '2026-08-18T10:00:00.000Z' }, { fichaCode: '3145557', assignedAt: '2026-08-18T10:00:00.000Z' }], createdAt: '2026-08-10T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z' },
  { id: '4', code: '301-3', status: 'inactive', quantity: 15, assignedFichas: [{ fichaCode: '3145558', assignedAt: '2026-08-01T10:00:00.000Z' }], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: '5', code: '401-4', status: 'active', quantity: 22, assignedFichas: [], createdAt: '2026-08-15T10:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z' },
  { id: '6', code: '103-1', status: 'inactive', quantity: 18, assignedFichas: [], createdAt: '2026-09-02T10:00:00.000Z', updatedAt: '2026-09-02T10:00:00.000Z' },
];

// Fichas mock para asignación
export const MOCK_FICHAS = [
  { id: '1', code: '3145555', name: 'ADSO - Ficha 3145555', program: 'Análisis y Desarrollo de Software', learners: 25 },
  { id: '2', code: '3145556', name: 'ADSO - Ficha 3145556', program: 'Análisis y Desarrollo de Software', learners: 18 },
  { id: '3', code: '3145557', name: 'ADSO - Ficha 3145557', program: 'Análisis y Desarrollo de Software', learners: 20 },
  { id: '4', code: '3145558', name: 'ADSO - Ficha 3145558', program: 'Análisis y Desarrollo de Software', learners: 22 },
];
