// ─────────────────────────────────────────────
//  features/environments/types.ts
//  Tipos del módulo de ambientes
// ─────────────────────────────────────────────

export type EnvironmentStatus = 'active' | 'inactive';

export interface Environment {
  id: string;
  code: string; // Nombre del ambiente. Ej: "209", "209-1", "Laboratorio A"
  status: EnvironmentStatus;
  quantity: number | null;
  assignmentsAvailable?: boolean;
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
