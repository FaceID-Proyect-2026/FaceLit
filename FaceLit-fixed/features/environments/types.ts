// ─────────────────────────────────────────────
//  features/environments/types.ts
//  Tipos del módulo de ambientes
// ─────────────────────────────────────────────

export type EnvironmentType = 'classroom' | 'laboratory' | 'workshop' | 'auditorium' | 'office';
export type EnvironmentStatus = 'active' | 'inactive' | 'maintenance';

export interface Environment {
  id: string;
  code: string;
  name: string;
  type: EnvironmentType;
  capacity: number;
  status: EnvironmentStatus;
  location: string;
  assignedFichas: string[];
}

export interface EnvironmentForm {
  code: string;
  name: string;
  type: EnvironmentType | '';
  capacity: string;
  status: EnvironmentStatus;
  location: string;
}

export const MOCK_ENVIRONMENTS: Environment[] = [
  { id: '1', code: 'AMB-101', name: 'Salón 101', type: 'classroom', capacity: 30, status: 'active', location: 'Edificio A - Piso 1', assignedFichas: ['3145555'] },
  { id: '2', code: 'AMB-102', name: 'Salón 102', type: 'classroom', capacity: 25, status: 'active', location: 'Edificio A - Piso 1', assignedFichas: [] },
  { id: '3', code: 'LAB-201', name: 'Laboratorio de Sistemas', type: 'laboratory', capacity: 20, status: 'active', location: 'Edificio B - Piso 2', assignedFichas: ['3145556', '3145557'] },
  { id: '4', code: 'TALL-301', name: 'Taller de Mecánica', type: 'workshop', capacity: 15, status: 'maintenance', location: 'Edificio C - Piso 1', assignedFichas: [] },
  { id: '5', code: 'AUD-401', name: 'Auditorio Principal', type: 'auditorium', capacity: 100, status: 'active', location: 'Edificio D - Piso 1', assignedFichas: [] },
  { id: '6', code: 'AMB-103', name: 'Salón 103', type: 'classroom', capacity: 30, status: 'inactive', location: 'Edificio A - Piso 1', assignedFichas: [] },
];

// Fichas mock para asignación
export const MOCK_FICHAS = [
  { id: '1', code: '3145555', name: 'ADSO - Ficha 3145555', program: 'Análisis y Desarrollo de Software', learners: 25 },
  { id: '2', code: '3145556', name: 'ADSO - Ficha 3145556', program: 'Análisis y Desarrollo de Software', learners: 18 },
  { id: '3', code: '3145557', name: 'ADSO - Ficha 3145557', program: 'Análisis y Desarrollo de Software', learners: 20 },
  { id: '4', code: '3145558', name: 'ADSO - Ficha 3145558', program: 'Análisis y Desarrollo de Software', learners: 22 },
];
