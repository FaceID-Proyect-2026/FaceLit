// ─────────────────────────────────────────────
//  features/academic/types.ts
// ─────────────────────────────────────────────
export type JornadaType = 'morning' | 'afternoon' | 'night' | 'full';

export interface Program {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  fichas: string[];
}

export interface Ficha {
  id: string;
  number: string;
  jornada: JornadaType;
  status: 'active' | 'inactive';
  programId: string;
  code: string;
  learners: Learner[];
}

export interface Learner {
  id: string;
  name: string;
  lastname: string;
  document: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

export const MOCK_PROGRAMS: Program[] = [
  { id: '1', name: 'Análisis y Desarrollo de Software', status: 'active', fichas: ['1', '2', '3', '4'] },
  { id: '2', name: 'Gestión Administrativa', status: 'active', fichas: ['5'] },
  { id: '3', name: 'Mantenimiento de Equipos de Cómputo', status: 'inactive', fichas: [] },
  { id: '4', name: 'Producción Multimedia', status: 'active', fichas: ['6'] },
];

export const MOCK_FICHAS: Ficha[] = [
  { id: '1', number: '3145555', jornada: 'morning', status: 'active', programId: '1', code: 'FCH-001', learners: [
    { id: 'l1', name: 'Juan', lastname: 'Pérez', document: '1122334455', email: 'juan@mail.com', role: 'aprendiz', status: 'active' },
    { id: 'l2', name: 'Ana', lastname: 'Martínez', document: '2233445566', email: 'ana@mail.com', role: 'aprendiz', status: 'active' },
    { id: 'l3', name: 'Carlos', lastname: 'López', document: '3344556677', email: 'carlos@mail.com', role: 'aprendiz', status: 'inactive' },
  ]},
  { id: '2', number: '3145556', jornada: 'afternoon', status: 'active', programId: '1', code: 'FCH-002', learners: [
    { id: 'l4', name: 'María', lastname: 'Gómez', document: '4455667788', email: 'maria@mail.com', role: 'aprendiz', status: 'active' },
  ]},
  { id: '3', number: '3145557', jornada: 'night', status: 'active', programId: '1', code: 'FCH-003', learners: [] },
  { id: '4', number: '3145558', jornada: 'full', status: 'active', programId: '1', code: 'FCH-004', learners: [] },
  { id: '5', number: '4100001', jornada: 'morning', status: 'active', programId: '2', code: 'FCH-005', learners: [] },
  { id: '6', number: '5200001', jornada: 'afternoon', status: 'active', programId: '4', code: 'FCH-006', learners: [] },
];
