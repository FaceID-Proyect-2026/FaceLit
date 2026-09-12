// ─────────────────────────────────────────────
//  features/academic/academicStore.ts
//  RF-3 V4 — Store de Gestión Académica
//  Programas · Fichas · Aprendices · Instructores
// ─────────────────────────────────────────────
import { getSchedulesSnapshot } from '../schedules/schedulesStore';
import {
    DocumentChangeLogEntry,
    Ficha,
    generateInitialPassword,
    Instructor,
    InstructorType,
    JornadaType,
    Learner,
    MOCK_FICHAS,
    MOCK_INSTRUCTORS,
    MOCK_PROGRAMS,
    Program,
    ValidationStatus
} from './types';

type Listener = () => void;

let programs: Program[]         = MOCK_PROGRAMS;
let fichas: Ficha[]             = MOCK_FICHAS;
let instructors: Instructor[]   = MOCK_INSTRUCTORS;

const listeners = new Set<Listener>();
function emit() { listeners.forEach(l => l()); }

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── Snapshots ────────────────────────────────
export const getProgramsSnapshot    = () => programs;
export const getFichasSnapshot      = () => fichas;
export const getInstructorsSnapshot = () => instructors;

export const getProgramById    = (id: string) => programs.find(p => p.id === id);
export const getFichaById      = (id: string) => fichas.find(f => f.id === id);
export const getInstructorById = (id: string) => instructors.find(i => i.id === id);

// ── RF-3.3 §10 — Generador de código de traslado ──
// 8 caracteres alfanuméricos aleatorios (letras mayúsculas + dígitos).
// No coincide con el ficha_codigo de 7 dígitos públicos.
export function generateTransferCode(): string {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/I/1 para evitar confusión visual
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

// ── Programas ─────────────────────────────────

/** RF-3.2 — Crea un programa. Rechaza nombres duplicados (case-insensitive). */
export function registerProgram(name: string, code?: string) {
  const normalizedName = name.trim();
  if (!normalizedName) return null;
  if (programs.some(p => p.name.toLowerCase() === normalizedName.toLowerCase())) return null;
  const now = new Date().toISOString();
  const p: Program = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: normalizedName,
    status: 'active',
    fichas: [],
    instructorIds: [],
    createdAt: now,
    updatedAt: now,
  };
  programs = [...programs, p];
  emit();
  return p;
}

export function updateProgramStore(id: string, name: string, status: 'active' | 'inactive') {
  programs = programs.map(p =>
    p.id === id ? { ...p, name: name.trim(), status, updatedAt: new Date().toISOString() } : p,
  );
  emit();
}

export function deactivateProgramStore(id: string) {
  const prog = programs.find(p => p.id === id);
  if (!prog) return { success: false, error: 'academic.programNotFound' };
  programs = programs.map(p =>
    p.id === id ? { ...p, status: 'inactive' as const, updatedAt: new Date().toISOString() } : p,
  );
  emit();
  return { success: true };
}

export function reactivateProgramStore(id: string) {
  const prog = programs.find(p => p.id === id);
  if (!prog) return { success: false, error: 'academic.programNotFound' };
  if (prog.status !== 'inactive') return { success: false, error: 'academic.alreadyActive' };
  programs = programs.map(p =>
    p.id === id ? { ...p, status: 'active' as const, updatedAt: new Date().toISOString() } : p,
  );
  emit();
  return { success: true };
}

export function deleteProgramStore(id: string) {
  const prog = programs.find(p => p.id === id);
  if (!prog) return { success: false, error: 'academic.programNotFound' };
  if (prog.status !== 'inactive') return { success: false, error: 'academic.noDeleteActiveProgram' };
  if (prog.fichas.length > 0) return { success: false, error: 'academic.programHasFichas' };
  programs = programs.filter(p => p.id !== id);
  emit();
  return { success: true };
}

// ── Fichas ────────────────────────────────────

export function registerFicha(number: string, jornada: JornadaType, programId: string) {
  const normalizedNumber = number.trim();
  const program = programs.find(p => p.id === programId);
  if (!normalizedNumber || !program || program.status !== 'active') return null;
  if (fichas.some(f => f.number === normalizedNumber)) return null;
  const now = new Date().toISOString();
  const f: Ficha = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    number: normalizedNumber,
    jornada,
    status: 'active',
    programId,
    code: `FCH-${Date.now().toString().slice(-6)}`,
    transferCode: generateTransferCode(),
    learners: [],
    createdAt: now,
    updatedAt: now,
  };
  fichas   = [...fichas, f];
  programs = programs.map(p => p.id === programId ? { ...p, fichas: [...p.fichas, f.id] } : p);
  emit();
  return f;
}

export function updateFichaStore(id: string, data: Partial<Ficha>) {
  const current = fichas.find(f => f.id === id);
  if (!current) return { success: false, error: 'academic.fichaNotFound' };
  const nextProgramId = data.programId ?? current.programId;
  const nextProgram   = programs.find(p => p.id === nextProgramId);
  if (!nextProgram || nextProgram.status !== 'active') return { success: false, error: 'academic.noActivePrograms' };
  const nextNumber = data.number?.trim();
  if (nextNumber && fichas.some(f => f.id !== id && f.number === nextNumber)) {
    return { success: false, error: 'academic.duplicateFicha' };
  }
  const now = new Date().toISOString();
  fichas = fichas.map(f =>
    f.id === id ? { ...f, ...data, number: data.number?.trim() ?? f.number, updatedAt: now } : f,
  );
  programs = programs.map(p => {
    const without = p.fichas.filter(fid => fid !== id);
    return p.id === nextProgramId
      ? { ...p, fichas: [...without, id], updatedAt: now }
      : { ...p, fichas: without };
  });
  emit();
  return { success: true };
}

/** RF-3.3 §10 — Regenera el código de traslado de una ficha (invalida el anterior). */
export function regenerateTransferCodeStore(fichaId: string) {
  const ficha = fichas.find(f => f.id === fichaId);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  const newCode = generateTransferCode();
  fichas = fichas.map(f =>
    f.id === fichaId ? { ...f, transferCode: newCode, updatedAt: new Date().toISOString() } : f,
  );
  emit();
  return { success: true, transferCode: newCode };
}

export function deactivateFichaStore(id: string) {
  const ficha = fichas.find(f => f.id === id);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  fichas = fichas.map(f =>
    f.id === id ? { ...f, status: 'inactive' as const, updatedAt: new Date().toISOString() } : f,
  );
  emit();
  return { success: true };
}

export function reactivateFichaStore(id: string) {
  const ficha = fichas.find(f => f.id === id);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  if (ficha.status !== 'inactive') return { success: false, error: 'academic.alreadyActive' };
  fichas = fichas.map(f =>
    f.id === id ? { ...f, status: 'active' as const, updatedAt: new Date().toISOString() } : f,
  );
  emit();
  return { success: true };
}

export function deleteFichaStore(id: string) {
  const ficha = fichas.find(f => f.id === id);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  if (ficha.status !== 'inactive') return { success: false, error: 'academic.noDeleteActiveFicha' };
  if (ficha.learners.length > 0) return { success: false, error: 'academic.fichaHasLearners' };
  if (getSchedulesSnapshot().some(s => s.fichaId === id)) return { success: false, error: 'academic.fichaHasSchedules' };
  fichas   = fichas.filter(f => f.id !== id);
  programs = programs.map(p => ({ ...p, fichas: p.fichas.filter(fid => fid !== id) }));
  emit();
  return { success: true };
}

export function unlinkFichaFromProgramStore(fichaId: string, programId: string) {
  const ficha = fichas.find(f => f.id === fichaId);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  if (ficha.learners.length > 0) return { success: false, error: 'academic.fichaHasLearnersUnlink' };
  programs = programs.map(p =>
    p.id === programId ? { ...p, fichas: p.fichas.filter(fid => fid !== fichaId) } : p,
  );
  fichas = fichas.map(f =>
    f.id === fichaId ? { ...f, programId: '', updatedAt: new Date().toISOString() } : f,
  );
  emit();
  return { success: true };
}

export function linkFichaToProgramStore(fichaId: string, programId: string) {
  const ficha   = fichas.find(f => f.id === fichaId);
  const program = programs.find(p => p.id === programId);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  if (!program) return { success: false, error: 'academic.programNotFound' };
  if (program.status !== 'active') return { success: false, error: 'academic.noActivePrograms' };
  fichas = fichas.map(f =>
    f.id === fichaId ? { ...f, programId, updatedAt: new Date().toISOString() } : f,
  );
  programs = programs.map(p =>
    p.id === programId && !p.fichas.includes(fichaId)
      ? { ...p, fichas: [...p.fichas, fichaId], updatedAt: new Date().toISOString() }
      : p,
  );
  emit();
  return { success: true };
}

// ── Aprendices ────────────────────────────────

export function addLearnerStore(fichaId: string, learner: Learner) {
  const target = fichas.find(f => f.id === fichaId);
  if (!target) return { success: false, error: 'academic.fichaNotFound' };
  if (target.status !== 'active') return { success: false, error: 'academic.fichaInactive' };
  if (target.learners.some(e => e.id === learner.id)) return { success: true };
  const alreadyAssigned = fichas.some(
    f => f.id !== fichaId && f.learners.some(e => e.id === learner.id && e.status === 'active'),
  );
  if (alreadyAssigned) return { success: false, error: 'academic.learnerAlreadyAssigned' };
  const now = new Date().toISOString();
  // Genera contraseña inicial si no viene con una
  const initialPassword = learner.initialPassword ?? generateInitialPassword(learner.document);
  const normalized = {
    ...learner,
    initialPassword,
    createdAt: learner.createdAt ?? now,
    updatedAt: now,
    documentChangeLog: learner.documentChangeLog ?? [],
  };
  fichas = fichas.map(f =>
    f.id === fichaId ? { ...f, learners: [...f.learners, normalized], updatedAt: now } : f,
  );
  emit();
  return { success: true, initialPassword };
}

/**
 * RF-3.2 — Los aprendices NUNCA se eliminan físicamente.
 * Solo pasan de activo → inactivo. Su historial se conserva.
 */
export function deactivateLearnerStore(fichaId: string, learnerId: string) {
  const ficha   = fichas.find(f => f.id === fichaId);
  const learner = ficha?.learners.find(l => l.id === learnerId);
  if (!ficha || !learner) return { success: false, error: 'academic.learnerNotFound' };
  fichas = fichas.map(f =>
    f.id === fichaId
      ? {
          ...f,
          learners: f.learners.map(l =>
            l.id === learnerId
              ? { ...l, status: 'inactive' as const, updatedAt: new Date().toISOString() }
              : l,
          ),
          updatedAt: new Date().toISOString(),
        }
      : f,
  );
  emit();
  return { success: true };
}

/** Reactiva un aprendiz que estaba inactivo en la misma ficha. */
export function reactivateLearnerStore(fichaId: string, learnerId: string) {
  const ficha   = fichas.find(f => f.id === fichaId);
  const learner = ficha?.learners.find(l => l.id === learnerId);
  if (!ficha || !learner) return { success: false, error: 'academic.learnerNotFound' };
  if (learner.status === 'active') return { success: false, error: 'academic.alreadyActive' };
  fichas = fichas.map(f =>
    f.id === fichaId
      ? {
          ...f,
          learners: f.learners.map(l =>
            l.id === learnerId
              ? { ...l, status: 'active' as const, updatedAt: new Date().toISOString() }
              : l,
          ),
          updatedAt: new Date().toISOString(),
        }
      : f,
  );
  emit();
  return { success: true };
}

/** Elimina físicamente al aprendiz de la ficha (solo para uso interno del pool orphan) */
export function removeLearnerStore(fichaId: string, learnerId: string) {
  fichas = fichas.map(f =>
    f.id === fichaId
      ? { ...f, learners: f.learners.filter(l => l.id !== learnerId), updatedAt: new Date().toISOString() }
      : f,
  );
  emit();
}

export function markLearnerValidation(learnerId: string, status: ValidationStatus) {
  const now = new Date().toISOString();
  fichas = fichas.map(f => ({
    ...f,
    learners: f.learners.map(l =>
      l.id === learnerId ? { ...l, validationStatus: status, updatedAt: now } : l,
    ),
  }));
  emit();
}

export function updateLearnerInfoStore(
  fichaId: string,
  learnerId: string,
  data: { name?: string; lastname?: string; email?: string; document?: string },
) {
  const ficha   = fichas.find(f => f.id === fichaId);
  const learner = ficha?.learners.find(l => l.id === learnerId);
  if (!ficha || !learner) return { success: false, error: 'academic.learnerNotFound' };

  const nextDoc = data.document?.trim();
  if (nextDoc && nextDoc !== learner.document) {
    if (!/^\d{10}$/.test(nextDoc)) return { success: false, error: 'academic.invalidDocument' };
    if (fichas.some(f => f.learners.some(l => l.id !== learnerId && l.document === nextDoc))) {
      return { success: false, error: 'academic.duplicateDocument' };
    }
  }

  const nextEmail = data.email?.trim().toLowerCase();
  if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return { success: false, error: 'academic.invalidEmail' };
  }

  const now = new Date().toISOString();
  fichas = fichas.map(f =>
    f.id === fichaId
      ? {
          ...f,
          learners: f.learners.map(l =>
            l.id === learnerId
              ? {
                  ...l,
                  name:     data.name?.trim()    ?? l.name,
                  lastname: data.lastname?.trim() ?? l.lastname,
                  email:    nextEmail             ?? l.email,
                  document: nextDoc               ?? l.document,
                  updatedAt: now,
                }
              : l,
          ),
          updatedAt: now,
        }
      : f,
  );
  emit();
  return { success: true };
}

export function updateLearnerDocument(
  fichaId: string,
  learnerId: string,
  document: string,
  changedBy?: string,
  reason?: string,
) {
  const ficha   = fichas.find(f => f.id === fichaId);
  const learner = ficha?.learners.find(l => l.id === learnerId);
  if (!ficha || !learner) return { success: false, error: 'academic.learnerNotFound' };
  const next = document.trim();
  if (!next) return { success: false, error: 'academic.documentRequired' };
  if (fichas.some(f => f.learners.some(l => l.id !== learnerId && l.document === next))) {
    return { success: false, error: 'academic.duplicateDocument' };
  }
  if (learner.document === next) return { success: true };
  const entry: DocumentChangeLogEntry = {
    id: Date.now().toString(), learnerId,
    oldDocument: learner.document, previousDocument: learner.document, newDocument: next,
    changedAt: new Date().toISOString(), changedBy, reason,
  };
  fichas = fichas.map(f =>
    f.id === fichaId
      ? {
          ...f,
          learners: f.learners.map(l =>
            l.id === learnerId
              ? { ...l, document: next, updatedAt: entry.changedAt, documentChangeLog: [...(l.documentChangeLog ?? []), entry] }
              : l,
          ),
          updatedAt: entry.changedAt,
        }
      : f,
  );
  emit();
  return { success: true };
}

export function correctInstitutionalLearnerStore(
  fichaId: string,
  learnerId: string,
  document: string,
  reason: string,
  changedBy?: string,
) {
  if (!reason.trim()) return { success: false, error: 'academic.correctionReasonRequired' };
  const result = updateLearnerDocument(fichaId, learnerId, document, changedBy, reason);
  if (!result.success) return result;
  markLearnerValidation(learnerId, 'validated');
  return { success: true };
}

// ── Orphan pool (traslado iniciado por Coordinador) ──

export interface OrphanLearner extends Learner {
  fromFichaId?: string;
  fromFichaNumber?: string;
  movedAt: string;
}

let orphanLearners: OrphanLearner[] = [];
export const getOrphanLearnersSnapshot = () => orphanLearners;

export function moveLearnerToOrphanPoolStore(fichaId: string, learnerId: string) {
  const ficha   = fichas.find(f => f.id === fichaId);
  const learner = ficha?.learners.find(l => l.id === learnerId);
  if (!ficha || !learner) return { success: false, error: 'academic.learnerNotFound' };
  const now = new Date().toISOString();
  fichas = fichas.map(f =>
    f.id === fichaId
      ? { ...f, learners: f.learners.filter(l => l.id !== learnerId), updatedAt: now }
      : f,
  );
  orphanLearners = [...orphanLearners, { ...learner, fromFichaId: ficha.id, fromFichaNumber: ficha.number, movedAt: now }];
  emit();
  return { success: true };
}

/**
 * RF-3.3 — El aprendiz ingresa el transferCode (8 chars alfanum) que le
 * entregó el Coordinador. Si es válido, se le asigna esa ficha y se
 * desactiva automáticamente su relación con la ficha anterior.
 *
 * Este código se usa desde dos flujos:
 * 1. Aprendiz en pool orphan (ya no tiene ficha activa).
 * 2. Aprendiz con ficha activa que quiere trasladarse directamente
 *    (el Coordinador le generó el transferCode de la ficha destino).
 */
export function joinFichaByTransferCodeStore(learnerId: string, transferCode: string) {
  const normalizedCode = transferCode.trim().toUpperCase();

  // Validar formato: 8 chars alfanuméricos
  if (!/^[A-Z0-9]{8}$/.test(normalizedCode)) {
    return { success: false, error: 'academic.transferCodeInvalid' };
  }

  // Buscar ficha destino por transferCode
  const target = fichas.find(f => f.transferCode === normalizedCode);
  if (!target) return { success: false, error: 'academic.transferCodeNotFound' };
  if (target.status !== 'active') return { success: false, error: 'academic.fichaInactive' };

  // Caso 1: aprendiz en orphan pool
  const orphan = orphanLearners.find(l => l.id === learnerId);
  if (orphan) {
    // Verificar que no está ya en la ficha destino
    if (target.learners.some(l => l.id === learnerId)) {
      return { success: false, error: 'academic.joinAlreadyInFicha' };
    }
    const { fromFichaId, fromFichaNumber, movedAt, ...plain } = orphan;
    const result = addLearnerStore(target.id, plain);
    if (!result.success) return result;
    orphanLearners = orphanLearners.filter(l => l.id !== learnerId);
    emit();
    return { success: true, fichaNumber: target.number };
  }

  // Caso 2: aprendiz activo en una ficha — traslado directo RF-3.3
  const currentFicha = fichas.find(f => f.learners.some(l => l.id === learnerId && l.status === 'active'));
  if (!currentFicha) return { success: false, error: 'academic.learnerNotFound' };

  // Ya está en la ficha destino
  if (currentFicha.id === target.id) {
    return { success: false, error: 'academic.joinAlreadyInFicha' };
  }

  const learner = currentFicha.learners.find(l => l.id === learnerId)!;
  const now = new Date().toISOString();

  // Desactivar en ficha actual (RF-3.3: la ficha anterior queda inactiva)
  fichas = fichas.map(f =>
    f.id === currentFicha.id
      ? {
          ...f,
          learners: f.learners.map(l =>
            l.id === learnerId ? { ...l, status: 'inactive' as const, updatedAt: now } : l,
          ),
          updatedAt: now,
        }
      : f,
  );

  // Agregar en ficha destino
  const result = addLearnerStore(target.id, { ...learner, status: 'active' as const });
  if (!result.success) {
    // Revertir si falla
    fichas = fichas.map(f =>
      f.id === currentFicha.id
        ? {
            ...f,
            learners: f.learners.map(l =>
              l.id === learnerId ? { ...l, status: 'active' as const } : l,
            ),
          }
        : f,
    );
    return result;
  }

  emit();
  return { success: true, fichaNumber: target.number, prevFichaNumber: currentFicha.number };
}

/** Compatibilidad con el flujo antiguo de orphan pool que usaba code interno */
export function joinFichaByCodeStore(learnerId: string, code: string) {
  const learner = orphanLearners.find(l => l.id === learnerId);
  if (!learner) return { success: false, error: 'academic.learnerNotFound' };
  const normalizedCode = code.trim().toUpperCase();
  // Primero intenta por transferCode (RF-3 V4)
  const byTransfer = fichas.find(f => f.transferCode === normalizedCode);
  if (byTransfer) return joinFichaByTransferCodeStore(learnerId, normalizedCode);
  // Fallback: búsqueda por code interno o número (compatibilidad)
  const target = fichas.find(
    f => f.code.toLowerCase() === code.trim().toLowerCase() || f.number === code.trim(),
  );
  if (!target) return { success: false, error: 'academic.fichaCodeNotFound' };
  if (target.status !== 'active') return { success: false, error: 'academic.fichaInactive' };
  const { fromFichaId, fromFichaNumber, movedAt, ...plain } = learner;
  const result = addLearnerStore(target.id, plain);
  if (!result.success) return result;
  orphanLearners = orphanLearners.filter(l => l.id !== learnerId);
  emit();
  return { success: true, fichaNumber: target.number };
}

export function deleteOrphanLearnerStore(learnerId: string) {
  if (!orphanLearners.some(l => l.id === learnerId)) return { success: false, error: 'academic.learnerNotFound' };
  orphanLearners = orphanLearners.filter(l => l.id !== learnerId);
  emit();
  return { success: true };
}

// ── Instructores (RF-3.0 V4) ──────────────────

/** RF-3.2 — Crea un instructor. Rechaza documentos duplicados. */
export function registerInstructorStore(data: {
  name: string;
  lastname: string;
  document: string;
  email: string;
  instructorType: InstructorType;
  programId?: string;
  fichaIds?: string[];
}) {
  const doc = data.document.trim();
  if (instructors.some(i => i.document === doc)) {
    return { success: false, error: 'academic.duplicateDocument' };
  }
  // Un instructor específico requiere programa válido
  if (data.instructorType === 'especifico') {
    const prog = programs.find(p => p.id === data.programId);
    if (!prog || prog.status !== 'active') {
      return { success: false, error: 'academic.noActivePrograms' };
    }
  }
  const now = new Date().toISOString();
  const initialPassword = generateInitialPassword(doc);
  const inst: Instructor = {
    id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: data.name.trim(),
    lastname: data.lastname.trim(),
    document: doc,
    email: data.email.trim().toLowerCase(),
    instructorType: data.instructorType,
    programId: data.instructorType === 'especifico' ? data.programId : undefined,
    fichaIds: data.fichaIds ?? [],
    status: 'active',
    initialPassword,
    createdAt: now,
    updatedAt: now,
  };
  instructors = [...instructors, inst];
  // Vincular al programa si es específico
  if (inst.instructorType === 'especifico' && inst.programId) {
    programs = programs.map(p =>
      p.id === inst.programId && !p.instructorIds.includes(inst.id)
        ? { ...p, instructorIds: [...p.instructorIds, inst.id], updatedAt: now }
        : p,
    );
  }
  emit();
  return { success: true, instructor: inst, initialPassword };
}

/** RF-3 — Asigna un instructor como responsable de una ficha. */
export function assignInstructorToFichaStore(instructorId: string, fichaId: string) {
  const inst  = instructors.find(i => i.id === instructorId);
  const ficha = fichas.find(f => f.id === fichaId);
  if (!inst)  return { success: false, error: 'academic.instructorNotFound' };
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  if (inst.fichaIds.includes(fichaId)) return { success: true }; // ya asignado
  instructors = instructors.map(i =>
    i.id === instructorId
      ? { ...i, fichaIds: [...i.fichaIds, fichaId], updatedAt: new Date().toISOString() }
      : i,
  );
  emit();
  return { success: true };
}

/** RF-3 — Desasigna un instructor de una ficha. */
export function unassignInstructorFromFichaStore(instructorId: string, fichaId: string) {
  const inst = instructors.find(i => i.id === instructorId);
  if (!inst) return { success: false, error: 'academic.instructorNotFound' };
  instructors = instructors.map(i =>
    i.id === instructorId
      ? { ...i, fichaIds: i.fichaIds.filter(fid => fid !== fichaId), updatedAt: new Date().toISOString() }
      : i,
  );
  emit();
  return { success: true };
}

/** Obtiene los instructores asignados a una ficha específica. */
export function getInstructorsByFichaId(fichaId: string): Instructor[] {
  return instructors.filter(i => i.fichaIds.includes(fichaId) && i.status === 'active');
}

export function updateInstructorStore(
  id: string,
  data: Partial<Pick<Instructor, 'name' | 'lastname' | 'email' | 'instructorType' | 'programId'>>,
) {
  const current = instructors.find(i => i.id === id);
  if (!current) return { success: false, error: 'academic.instructorNotFound' };

  const newType = data.instructorType ?? current.instructorType;
  const newProgramId = newType === 'especifico' ? (data.programId ?? current.programId) : undefined;

  if (newType === 'especifico') {
    const prog = programs.find(p => p.id === newProgramId);
    if (!prog || prog.status !== 'active') return { success: false, error: 'academic.noActivePrograms' };
  }

  const now = new Date().toISOString();

  // Actualizar relación de programa anterior si cambió
  if (current.programId && current.programId !== newProgramId) {
    programs = programs.map(p =>
      p.id === current.programId
        ? { ...p, instructorIds: p.instructorIds.filter(iid => iid !== id), updatedAt: now }
        : p,
    );
  }
  if (newProgramId && newProgramId !== current.programId) {
    programs = programs.map(p =>
      p.id === newProgramId && !p.instructorIds.includes(id)
        ? { ...p, instructorIds: [...p.instructorIds, id], updatedAt: now }
        : p,
    );
  }

  instructors = instructors.map(i =>
    i.id === id
      ? {
          ...i,
          name: data.name?.trim() ?? i.name,
          lastname: data.lastname?.trim() ?? i.lastname,
          email: data.email?.trim().toLowerCase() ?? i.email,
          instructorType: newType,
          programId: newProgramId,
          updatedAt: now,
        }
      : i,
  );
  emit();
  return { success: true };
}

export function deactivateInstructorStore(id: string) {
  const inst = instructors.find(i => i.id === id);
  if (!inst) return { success: false, error: 'academic.instructorNotFound' };
  instructors = instructors.map(i =>
    i.id === id ? { ...i, status: 'inactive' as const, updatedAt: new Date().toISOString() } : i,
  );
  emit();
  return { success: true };
}

export function reactivateInstructorStore(id: string) {
  const inst = instructors.find(i => i.id === id);
  if (!inst) return { success: false, error: 'academic.instructorNotFound' };
  if (inst.status !== 'inactive') return { success: false, error: 'academic.alreadyActive' };
  instructors = instructors.map(i =>
    i.id === id ? { ...i, status: 'active' as const, updatedAt: new Date().toISOString() } : i,
  );
  emit();
  return { success: true };
}

export function deleteInstructorStore(id: string) {
  const inst = instructors.find(i => i.id === id);
  if (!inst) return { success: false, error: 'academic.instructorNotFound' };
  if (inst.status !== 'inactive') return { success: false, error: 'academic.noDeleteActiveInstructor' };
  // RF-3.2: no se puede eliminar si tiene historial de asistencias
  // (con backend real se verificaría; en mock lo permitimos si no hay horarios asociados)
  const hasSchedules = getSchedulesSnapshot().some(s => s.instructorId === id);
  if (hasSchedules) return { success: false, error: 'academic.instructorHasAttendance' };
  // Limpiar de programas
  programs = programs.map(p => ({
    ...p,
    instructorIds: p.instructorIds.filter(iid => iid !== id),
  }));
  instructors = instructors.filter(i => i.id !== id);
  emit();
  return { success: true };
}
