// ─────────────────────────────────────────────
//  features/academic/periods/types.ts
//  Período académico (Prompt maestro, sección 7). El modelo es
//  genérico: no asume que todos los períodos son trimestres, para
//  poder soportar SENA (trimestres) y otras instituciones
//  (bimestres, semestres, cuatrimestres u "otro").
// ─────────────────────────────────────────────

export const PERIOD_TYPES = ['TRIMESTRE', 'BIMESTRE', 'SEMESTRE', 'CUATRIMESTRE', 'OTRO'] as const;
export type PeriodType = typeof PERIOD_TYPES[number];

export type AcademicPeriodStatus = 'active' | 'inactive';

export interface AcademicPeriod {
  id: string;
  name: string; // Ej: "Trimestre 1 - 2026" — se genera a partir de type/number/year, pero es editable
  type: PeriodType;
  number: number; // Ej: 1, 2, 3...
  year: number;
  startDate: string; // "AAAA-MM-DD"
  endDate: string;   // "AAAA-MM-DD"
  status: AcademicPeriodStatus;
  createdAt: string;
  updatedAt: string;
}

// Genera el nombre por defecto de un período a partir de su tipo, número y año.
export function buildPeriodName(type: PeriodType, number: number, year: number, labelByType: Record<PeriodType, string>): string {
  return `${labelByType[type]} ${number} - ${year}`;
}

export const MOCK_ACADEMIC_PERIODS: AcademicPeriod[] = [
  { id: 'p1', name: 'Trimestre 1 - 2026', type: 'TRIMESTRE', number: 1, year: 2026, startDate: '2026-01-08', endDate: '2026-04-10', status: 'active', createdAt: '2025-12-01T10:00:00.000Z', updatedAt: '2025-12-01T10:00:00.000Z' },
  { id: 'p2', name: 'Trimestre 2 - 2026', type: 'TRIMESTRE', number: 2, year: 2026, startDate: '2026-04-13', endDate: '2026-07-17', status: 'active', createdAt: '2025-12-01T10:00:00.000Z', updatedAt: '2025-12-01T10:00:00.000Z' },
];
