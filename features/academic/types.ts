// ─────────────────────────────────────────────
//  features/academic/types.ts
//  RF-3 V4 — Gestión Académica
// ─────────────────────────────────────────────

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
  /** Nombre completo del aprendiz (desnormalizado para fácil lectura en UI) */
  learnerName: string;
  learnerDocument: string;
  /** Número de la ficha actual (desnormalizado) — ej. "3145555" */
  learnerFicha: string;
  currentFichaId: string;
  currentFichaNumber: string;
  requestedFichaId: string;
  requestedFichaNumber: string;
  status: TransferStatus;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
}

export interface Program {
  id: string;
  name: string;
  code?: string;
  status: 'active' | 'inactive';
  fichas: string[];      // IDs de fichas
  instructorIds: string[]; // IDs de instructores específicos de este programa
  createdAt: string;
  updatedAt: string;
}

export interface Ficha {
  id: string;
  number: string;        // 7 dígitos — ej. 2825551
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
  document: string;      // 6 a 15 dígitos (RF-1 V4 §1)
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
  userId?: string;
  name: string;
  lastname: string;
  document: string;      // 6 a 15 dígitos
  email: string;
  instructorType: InstructorType;
  /** Solo se usa si instructorType === 'especifico' */
  programId?: string;
  programIds?: string[];
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
  generatedPasswords: Array<{
    document: string;
    password: string;
    name?: string;
    role?: 'aprendiz' | 'instructor' | string;
    ficha?: string;
    program?: string;
  }>;
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

export function getProgramDisplayName(
  program: { id: string; name: string },
  t: (key: string) => string,
): string {
  // Backend program names are business data, not translation keys.
  void t;
  return program.name;
}
