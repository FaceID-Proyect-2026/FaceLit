// ─────────────────────────────────────────────
//  features/academic/types.ts
//  RF-3 V4 — Gestión Académica
// ─────────────────────────────────────────────

export type JornadaType       = 'morning' | 'afternoon' | 'night' | 'full';
export type ValidationStatus  = 'pending_validation' | 'validated' | 'inconsistency';
export type TransferStatus    = 'pending' | 'approved' | 'rejected';

// RF-3.0 — Tipo de instructor
export type InstructorType = 'especifico' | 'transversal';

// ── Entidades ────────────────────────────────

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
  fichas: string[];      // IDs de fichas
  instructorIds: string[]; // IDs de instructores específicos de este programa
  createdAt: string;
  updatedAt: string;
}

export interface Ficha {
  id: string;
  number: string;        // 7 dígitos — ej. 2825551
  jornada: JornadaType;
  status: 'active' | 'inactive';
  programId: string;
  code: string;          // código interno FCH-XXXXXX (no adivinable, no es el transferCode)
  /** RF-3.3 / RF-3 V4 §10 — Código de traslado: 8 chars alfanuméricos
   *  generado por el Coordinador. Distinto al `code` interno.
   *  No vence por tiempo; se regenera manualmente.
   */
  transferCode: string;
  learners: Learner[];
  createdAt: string;
  updatedAt: string;
}

export interface Learner {
  id: string;
  name: string;
  lastname: string;
  document: string;      // 10 dígitos exactos (RF-1 V4 §1)
  email: string;         // obligatorio (RF-3.1 §5)
  role: string;
  status: 'active' | 'inactive';
  validationStatus: ValidationStatus;
  /** RF-3.2 — Contraseña inicial generada por el sistema al crear la cuenta.
   *  El Coordinador se la entrega al aprendiz fuera del sistema.
   *  Se anula (null) después de que el aprendiz cambia su contraseña. */
  initialPassword: string | null;
  createdAt?: string;
  updatedAt?: string;
  documentChangeLog?: DocumentChangeLogEntry[];
}

// RF-3.0 — Instructor (entidad nueva en V4)
export interface Instructor {
  id: string;
  name: string;
  lastname: string;
  document: string;      // 10 dígitos
  email: string;
  instructorType: InstructorType;
  /** Solo se usa si instructorType === 'especifico' */
  programId?: string;
  /** RF-3 — Fichas a las que está asignado como responsable (1 o varias) */
  fichaIds: string[];
  status: 'active' | 'inactive';
  /** RF-3.2 — Contraseña inicial generada por el sistema al crear la cuenta.
   *  El Coordinador se la entrega al instructor fuera del sistema.
   *  Se anula (null) después de que el instructor cambia su contraseña. */
  initialPassword: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Resultado de la carga CSV V4 ─────────────
// RF-3.1 — Resumen final con las 4 categorías

export type CsvRowCategory = 'created' | 'updated' | 'blocked' | 'error';

export interface CsvRowResult {
  rowIndex: number;
  category: CsvRowCategory;
  tipo: string;
  identifier: string;  // documento, codigo de programa o ficha
  message: string;     // mensaje en lenguaje simple para el Coordinador
  /** Solo para 'blocked': id del registro en conflicto para ir a corregir */
  conflictRecordId?: string;
  conflictRecordType?: 'program' | 'ficha' | 'learner' | 'instructor';
}

export interface CsvImportSummaryV4 {
  created: number;
  updated: number;
  blocked: number;
  errors: number;
  rows: CsvRowResult[];
}

// ── Generador de contraseña inicial ──────────
// RF-3.2 — El sistema genera una contraseña que cumple la política
// (8-15 chars, letra, número, símbolo) y el Coordinador la entrega
// al usuario fuera del sistema. Formato: Doc4 primeros dígitos + símbolo + 3 letras + 2 números.
export function generateInitialPassword(document: string): string {
  const symbols  = '!@#$';
  const letters  = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const prefix   = document.slice(0, 4);   // primeros 4 dígitos del documento
  const sym      = symbols[Math.floor(Math.random() * symbols.length)];
  const let1     = letters[Math.floor(Math.random() * letters.length)];
  const let2     = letters[Math.floor(Math.random() * letters.length)];
  const let3     = letters[Math.floor(Math.random() * letters.length)];
  const num1     = Math.floor(Math.random() * 10);
  const num2     = Math.floor(Math.random() * 10);
  return `${prefix}${sym}${let1}${let2}${let3}${num1}${num2}`;
  // Ejemplo: "1002!Xky47"  — 10 chars, tiene letra, número, símbolo
}

// ── Mocks ────────────────────────────────────

export const MOCK_PROGRAMS: Program[] = [
  {
    id: '1', name: 'Análisis y Desarrollo de Software',
    status: 'active', fichas: ['1', '2', '3', '4'], instructorIds: ['i-1'],
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: '2', name: 'Gestión Administrativa',
    status: 'active', fichas: ['5'], instructorIds: [],
    createdAt: '2026-08-10T10:00:00.000Z', updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: '3', name: 'Mantenimiento de Equipos de Cómputo',
    status: 'inactive', fichas: [], instructorIds: [],
    createdAt: '2026-08-15T10:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: '4', name: 'Producción Multimedia',
    status: 'active', fichas: ['6'], instructorIds: [],
    createdAt: '2026-09-02T10:00:00.000Z', updatedAt: '2026-09-02T10:00:00.000Z',
  },
];

// Los 4 programas mock tienen traducción disponible (academic.programNames.<id>).
const MOCK_PROGRAM_IDS = new Set(MOCK_PROGRAMS.map(p => p.id));

export function getProgramDisplayName(
  program: { id: string; name: string },
  t: (key: string) => string,
): string {
  return MOCK_PROGRAM_IDS.has(program.id)
    ? t(`academic.programNames.${program.id}`)
    : program.name;
}

export const MOCK_FICHAS: Ficha[] = [
  {
    id: '1', number: '3145555', jornada: 'morning',
    status: 'active', programId: '1',
    code: 'FCH-001', transferCode: 'A1B2C3D4',
    learners: [
      {
        id: 'u-appr-1', name: 'Juan', lastname: 'Pérez',
        document: '1000000004', email: 'juan.perez@facelit.test',
        role: 'aprendiz', status: 'active', validationStatus: 'validated',
        initialPassword: '1000!Xky47',
        documentChangeLog: [],
      },
      {
        id: 'l2', name: 'Ana', lastname: 'Martínez',
        document: '1122334455', email: 'ana@mail.com',
        role: 'aprendiz', status: 'active', validationStatus: 'validated',
        initialPassword: '1122!Abc12',
        documentChangeLog: [],
      },
      {
        id: 'l3', name: 'Carlos', lastname: 'López',
        document: '2233445566', email: 'carlos@mail.com',
        role: 'aprendiz', status: 'inactive', validationStatus: 'validated',
        initialPassword: null,  // ya cambió su contraseña
        documentChangeLog: [],
      },
    ],
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: '2', number: '3145556', jornada: 'afternoon',
    status: 'active', programId: '1',
    code: 'FCH-002', transferCode: 'E5F6G7H8',
    learners: [
      {
        id: 'l4', name: 'María', lastname: 'Gómez',
        document: '3344556677', email: 'maria@mail.com',
        role: 'aprendiz', status: 'active', validationStatus: 'validated',
        initialPassword: '3344!Mnp89',
        documentChangeLog: [],
      },
    ],
    createdAt: '2026-08-10T10:00:00.000Z', updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: '3', number: '3145557', jornada: 'night',
    status: 'active', programId: '1',
    code: 'FCH-003', transferCode: 'J9K0L1M2',
    learners: [],
    createdAt: '2026-08-15T10:00:00.000Z', updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: '4', number: '3145558', jornada: 'full',
    status: 'active', programId: '1',
    code: 'FCH-004', transferCode: 'N3O4P5Q6',
    learners: [],
    createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z',
  },
  {
    id: '5', number: '4100001', jornada: 'morning',
    status: 'active', programId: '2',
    code: 'FCH-005', transferCode: 'R7S8T9U0',
    learners: [],
    createdAt: '2026-08-25T10:00:00.000Z', updatedAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: '6', number: '5200001', jornada: 'afternoon',
    status: 'active', programId: '4',
    code: 'FCH-006', transferCode: 'V1W2X3Y4',
    learners: [],
    createdAt: '2026-09-02T10:00:00.000Z', updatedAt: '2026-09-02T10:00:00.000Z',
  },
];

// Instructores mock (RF-3.0 V4)
export const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: 'i-1',
    name: 'María', lastname: 'González',
    document: '1000000003',   // coincide con MOCK_ACCOUNTS u-inst-1
    email: 'maria.gonzalez@facelit.test',
    instructorType: 'especifico',
    programId: '1',           // ADSO
    fichaIds: ['1', '2'],     // responsable de fichas 3145555 y 3145556
    status: 'active',
    initialPassword: null,    // ya cambió su contraseña (usa la de AuthContext)
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  },
  {
    id: 'i-2',
    name: 'Carlos', lastname: 'Ruiz',
    document: '5060708090',
    email: 'carlos.ruiz@facelit.test',
    instructorType: 'transversal',
    programId: undefined,
    fichaIds: ['3'],          // responsable de la ficha 3145557
    status: 'active',
    initialPassword: '5060!Xyz34',
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
];
