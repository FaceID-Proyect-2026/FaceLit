// ─────────────────────────────────────────────
//  features/academic/types.ts
// ─────────────────────────────────────────────
export type JornadaType = 'morning' | 'afternoon' | 'night' | 'full';
export type ValidationStatus = 'pending_validation' | 'validated' | 'inconsistency';
export type TransferStatus = 'pending' | 'approved' | 'rejected';

export interface DocumentChangeLogEntry {
  id?: string;
  learnerId?: string;
  oldDocument?: string;
  previousDocument: string;
  newDocument: string;
  changedAt: string;
  changedBy?: string;
  reason?: string;
}

export interface TransferRequest {
  id: string;
  learnerId: string;
  learnerFicha: string;
  currentFichaId: string;
  requestedFichaId: string;
  status: TransferStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
  approvalConditions?: string;
}

export interface Program {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  fichas: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Ficha {
  id: string;
  number: string;
  jornada: JornadaType;
  status: 'active' | 'inactive';
  programId: string;
  code: string;
  learners: Learner[];
  createdAt: string;
  updatedAt: string;
}

export interface Learner {
  id: string;
  name: string;
  lastname: string;
  document: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  validationStatus: ValidationStatus;
  createdAt?: string;
  updatedAt?: string;
  documentChangeLog?: DocumentChangeLogEntry[];
}

export const MOCK_PROGRAMS: Program[] = [
  { id: '1', name: 'Análisis y Desarrollo de Software', status: 'active', fichas: ['1', '2', '3', '4'], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: '2', name: 'Gestión Administrativa', status: 'active', fichas: ['5'], createdAt: '2026-08-10T10:00:00.000Z', updatedAt: '2026-08-10T10:00:00.000Z' },
  { id: '3', name: 'Mantenimiento de Equipos de Cómputo', status: 'inactive', fichas: [], createdAt: '2026-08-15T10:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z' },
  { id: '4', name: 'Producción Multimedia', status: 'active', fichas: ['6'], createdAt: '2026-09-02T10:00:00.000Z', updatedAt: '2026-09-02T10:00:00.000Z' },
];

// Los 4 programas mock tienen traducción disponible (academic.programNames.<id>).
// Los programas creados por el administrador solo existen en el idioma en que se registraron,
// así que se muestran tal cual (program.name) sin pasar por esta tabla.
const MOCK_PROGRAM_IDS = new Set(MOCK_PROGRAMS.map(p => p.id));

export function getProgramDisplayName(program: { id: string; name: string }, t: (key: string) => string): string {
  return MOCK_PROGRAM_IDS.has(program.id) ? t(`academic.programNames.${program.id}`) : program.name;
}

export const MOCK_FICHAS: Ficha[] = [
  { id: '1', number: '3145555', jornada: 'morning', status: 'active', programId: '1', code: 'FCH-001', learners: [
    { id: 'l1', name: 'Juan', lastname: 'Pérez', document: '1122334455', email: 'juan@mail.com', role: 'aprendiz', status: 'active', validationStatus: 'validated', documentChangeLog: [] },
    { id: 'l2', name: 'Ana', lastname: 'Martínez', document: '2233445566', email: 'ana@mail.com', role: 'aprendiz', status: 'active', validationStatus: 'validated', documentChangeLog: [] },
    { id: 'l3', name: 'Carlos', lastname: 'López', document: '3344556677', email: 'carlos@mail.com', role: 'aprendiz', status: 'inactive', validationStatus: 'validated', documentChangeLog: [] },
  ], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z'},
  { id: '2', number: '3145556', jornada: 'afternoon', status: 'active', programId: '1', code: 'FCH-002', learners: [{ id: 'l4', name: 'María', lastname: 'Gómez', document: '4455667788', email: 'maria@mail.com', role: 'aprendiz', status: 'active', validationStatus: 'validated', documentChangeLog: [] }], createdAt: '2026-08-10T10:00:00.000Z', updatedAt: '2026-08-10T10:00:00.000Z' },
  { id: '3', number: '3145557', jornada: 'night', status: 'active', programId: '1', code: 'FCH-003', learners: [], createdAt: '2026-08-15T10:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z' },
  { id: '4', number: '3145558', jornada: 'full', status: 'active', programId: '1', code: 'FCH-004', learners: [], createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z' },
  { id: '5', number: '4100001', jornada: 'morning', status: 'active', programId: '2', code: 'FCH-005', learners: [], createdAt: '2026-08-25T10:00:00.000Z', updatedAt: '2026-08-25T10:00:00.000Z' },
  { id: '6', number: '5200001', jornada: 'afternoon', status: 'active', programId: '4', code: 'FCH-006', learners: [], createdAt: '2026-09-02T10:00:00.000Z', updatedAt: '2026-09-02T10:00:00.000Z' },
];
