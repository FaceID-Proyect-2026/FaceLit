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
  assignedFichas: string[];
}

export interface EnvironmentForm {
  code: string;
  status?: EnvironmentStatus;
  quantity?: number;
}

// El nombre del ambiente admite letras, números, espacios y guiones.
// Ej: "209", "209-1", "Laboratorio A", "Sala 2"
export const ENVIRONMENT_NAME_REGEX = /^[\p{L}0-9][\p{L}0-9\s-]*$/u;

// Cantidad mínima de aprendices permitida al registrar un ambiente (RN-19).
export const MIN_ENVIRONMENT_QUANTITY = 50;

export const MOCK_ENVIRONMENTS: Environment[] = [
  { id: '1', code: '101-1', status: 'active', quantity: 25, assignedFichas: ['3145555'] },
  { id: '2', code: '102-1', status: 'active', quantity: 20, assignedFichas: [] },
  { id: '3', code: '201-2', status: 'active', quantity: 30, assignedFichas: ['3145556', '3145557'] },
  { id: '4', code: '301-3', status: 'inactive', quantity: 15, assignedFichas: [] },
  { id: '5', code: '401-4', status: 'active', quantity: 22, assignedFichas: [] },
  { id: '6', code: '103-1', status: 'inactive', quantity: 18, assignedFichas: [] },
];

// Fichas mock para asignación
export const MOCK_FICHAS = [
  { id: '1', code: '3145555', name: 'ADSO - Ficha 3145555', program: 'Análisis y Desarrollo de Software', learners: 25 },
  { id: '2', code: '3145556', name: 'ADSO - Ficha 3145556', program: 'Análisis y Desarrollo de Software', learners: 18 },
  { id: '3', code: '3145557', name: 'ADSO - Ficha 3145557', program: 'Análisis y Desarrollo de Software', learners: 20 },
  { id: '4', code: '3145558', name: 'ADSO - Ficha 3145558', program: 'Análisis y Desarrollo de Software', learners: 22 },
];
