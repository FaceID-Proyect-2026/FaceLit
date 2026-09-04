// ─────────────────────────────────────────────
//  features/academic/academicStore.ts
//  Store compartido (fuera de React) para que todas las
//  pantallas (listado, registro, detalle) vean siempre los
//  mismos datos, sin importar cuántas veces se invoque el
//  hook `useAcademic`.
//
//  Antes, `useAcademic` guardaba `programs`/`fichas` con
//  `useState` directamente dentro del hook. Cada pantalla que
//  lo invocaba (listado, registrar, detalle) creaba su propia
//  copia aislada del estado: al registrar un programa en la
//  pantalla de registro, el nuevo programa nunca aparecía en
//  el listado porque cada una tenía su propio arreglo en
//  memoria. Este store replica el mismo patrón que ya se usa
//  correctamente en `features/environments/environmentsStore.ts`.
// ─────────────────────────────────────────────
import { DocumentChangeLogEntry, Ficha, JornadaType, Learner, MOCK_FICHAS, MOCK_PROGRAMS, Program, ValidationStatus } from './types';

type Listener = () => void;

let programs: Program[] = MOCK_PROGRAMS;
let fichas: Ficha[] = MOCK_FICHAS;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProgramsSnapshot() {
  return programs;
}

export function getFichasSnapshot() {
  return fichas;
}

export function getProgramById(id: string) {
  return programs.find(p => p.id === id);
}

export function getFichaById(id: string) {
  return fichas.find(f => f.id === id);
}

export function registerProgram(name: string) {
  const normalizedName = name.trim();
  if (!normalizedName || programs.some(program => program.name.toLowerCase() === normalizedName.toLowerCase())) return null;
  const now = new Date().toISOString();
  const p: Program = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: normalizedName, status: 'active', fichas: [], createdAt: now, updatedAt: now };
  programs = [...programs, p];
  emit();
  return p;
}

export function updateProgramStore(id: string, name: string, status: 'active' | 'inactive') {
  programs = programs.map(p => (p.id === id ? { ...p, name: name.trim(), status, updatedAt: new Date().toISOString() } : p));
  emit();
}

// Desactivación lógica: cambia el estado a Inactivo pero conserva el registro
// y su información (fichas asociadas, etc.).
export function deactivateProgramStore(id: string) {
  const prog = programs.find(p => p.id === id);
  if (!prog) return { success: false, error: 'academic.programNotFound' };
  programs = programs.map(p => (p.id === id ? { ...p, status: 'inactive' as const, updatedAt: new Date().toISOString() } : p));
  emit();
  return { success: true };
}

export function reactivateProgramStore(id: string) {
  const program = programs.find(p => p.id === id);
  if (!program) return { success: false, error: 'academic.programNotFound' };
  if (program.status !== 'inactive') return { success: false, error: 'academic.alreadyActive' };
  programs = programs.map(p => p.id === id ? { ...p, status: 'active' as const, updatedAt: new Date().toISOString() } : p);
  emit();
  return { success: true };
}

// Eliminación física — solo debe usarse desde la pestaña de Inactivos.
export function deleteProgramStore(id: string) {
  const prog = programs.find(p => p.id === id);
  if (prog && prog.fichas.length > 0) return { success: false, error: 'academic.programHasFichas' };
  programs = programs.filter(p => p.id !== id);
  emit();
  return { success: true };
}

export function registerFicha(number: string, jornada: JornadaType, programId: string) {
  const normalizedNumber = number.trim();
  const program = programs.find(item => item.id === programId);
  if (!normalizedNumber || !program || program.status !== 'active' || fichas.some(ficha => ficha.number === normalizedNumber)) return null;
  const now = new Date().toISOString();
  const f: Ficha = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    number: normalizedNumber,
    jornada,
    status: 'active',
    programId,
    code: `FCH-${Date.now().toString().slice(-6)}`,
    learners: [],
    createdAt: now,
    updatedAt: now,
  };
  fichas = [...fichas, f];
  programs = programs.map(p => (p.id === programId ? { ...p, fichas: [...p.fichas, f.id] } : p));
  emit();
  return f;
}

export function updateFichaStore(id: string, data: Partial<Ficha>) {
  const current = fichas.find(ficha => ficha.id === id);
  if (!current) return { success: false, error: 'academic.fichaNotFound' };
  const nextProgramId = data.programId ?? current.programId;
  const nextProgram = programs.find(program => program.id === nextProgramId);
  if (!nextProgram || nextProgram.status !== 'active') return { success: false, error: 'academic.noActivePrograms' };
  const nextNumber = data.number?.trim();
  if (nextNumber && fichas.some(ficha => ficha.id !== id && ficha.number === nextNumber)) return { success: false, error: 'academic.duplicateFicha' };
  const now = new Date().toISOString();
  fichas = fichas.map(f => (f.id === id ? { ...f, ...data, number: data.number?.trim() ?? f.number, updatedAt: now } : f));
  programs = programs.map(program => {
    const withoutFicha = program.fichas.filter(fichaId => fichaId !== id);
    return program.id === nextProgramId
      ? { ...program, fichas: [...withoutFicha, id], updatedAt: now }
      : { ...program, fichas: withoutFicha };
  });
  emit();
  return { success: true };
}

export function deleteFichaStore(id: string) {
  const ficha = fichas.find(f => f.id === id);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  if (ficha.status !== 'inactive') return { success: false, error: 'academic.noDeleteActiveFicha' };
  if (ficha?.learners.length) return { success: false, error: 'academic.fichaHasLearners' };
  fichas = fichas.filter(f => f.id !== id);
  programs = programs.map(p => ({ ...p, fichas: p.fichas.filter(fid => fid !== id) }));
  emit();
  return { success: true };
}

export function deactivateFichaStore(id: string) {
  const ficha = fichas.find(f => f.id === id);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  fichas = fichas.map(f => f.id === id ? { ...f, status: 'inactive' as const, updatedAt: new Date().toISOString() } : f);
  emit();
  return { success: true };
}

export function reactivateFichaStore(id: string) {
  const ficha = fichas.find(f => f.id === id);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  if (ficha.status !== 'inactive') return { success: false, error: 'academic.alreadyActive' };
  fichas = fichas.map(f => f.id === id ? { ...f, status: 'active' as const, updatedAt: new Date().toISOString() } : f);
  emit();
  return { success: true };
}

// Desvincula la ficha del programa: solo se elimina la relación
// (tanto en el arreglo `fichas` del programa como en `programId` de la
// ficha). La ficha y su información (código, aprendices, etc.) se
// conservan intactas y quedan disponibles para vincularse nuevamente.
export function unlinkFichaFromProgramStore(fichaId: string, programId: string) {
  programs = programs.map(p => (p.id === programId ? { ...p, fichas: p.fichas.filter(fid => fid !== fichaId) } : p));
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, programId: '', updatedAt: new Date().toISOString() } : f));
  emit();
  return { success: true };
}

// Vincula una ficha desvinculada a un programa: actualiza `programId` en
// la ficha y agrega su id al arreglo `fichas` del programa, igual que
// `assignFichaToEnvironment` en environmentsStore.
export function linkFichaToProgramStore(fichaId: string, programId: string) {
  const ficha = fichas.find(f => f.id === fichaId);
  if (!ficha) return { success: false, error: 'academic.fichaNotFound' };
  const program = programs.find(p => p.id === programId);
  if (!program) return { success: false, error: 'academic.programNotFound' };
  if (program.status !== 'active') return { success: false, error: 'academic.noActivePrograms' };
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, programId, updatedAt: new Date().toISOString() } : f));
  programs = programs.map(p => (p.id === programId && !p.fichas.includes(fichaId) ? { ...p, fichas: [...p.fichas, fichaId], updatedAt: new Date().toISOString() } : p));
  emit();
  return { success: true };
}

export function addLearnerStore(fichaId: string, learner: Learner) {
  const target = fichas.find(ficha => ficha.id === fichaId);
  if (!target) return { success: false, error: 'academic.fichaNotFound' };
  if (target.status !== 'active') return { success: false, error: 'academic.fichaInactive' };
  if (target.learners.some(existing => existing.id === learner.id)) return { success: true };
  const alreadyAssigned = fichas.some(ficha => ficha.id !== fichaId && ficha.learners.some(existing => existing.id === learner.id && existing.status === 'active'));
  if (alreadyAssigned) return { success: false, error: 'academic.learnerAlreadyAssigned' };
  const now = new Date().toISOString();
  const normalizedLearner = { ...learner, createdAt: learner.createdAt ?? now, updatedAt: now, documentChangeLog: learner.documentChangeLog ?? [] };
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, learners: [...f.learners, normalizedLearner], updatedAt: now } : f));
  emit();
  return { success: true };
}

export function removeLearnerStore(fichaId: string, learnerId: string) {
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, learners: f.learners.filter(l => l.id !== learnerId), updatedAt: new Date().toISOString() } : f));
  emit();
}

export function markLearnerValidation(learnerId: string, status: ValidationStatus) {
  const now = new Date().toISOString();
  fichas = fichas.map(f => ({ ...f, learners: f.learners.map(learner => learner.id === learnerId ? { ...learner, validationStatus: status, updatedAt: now } : learner), updatedAt: now }));
  emit();
}

export function updateLearnerDocument(fichaId: string, learnerId: string, document: string, changedBy?: string, reason?: string) {
  const ficha = fichas.find(item => item.id === fichaId);
  const learner = ficha?.learners.find(item => item.id === learnerId);
  if (!ficha || !learner) return { success: false, error: 'academic.learnerNotFound' };
  const nextDocument = document.trim();
  if (!nextDocument) return { success: false, error: 'academic.documentRequired' };
  if (fichas.some(item => item.learners.some(other => other.id !== learnerId && other.document === nextDocument))) return { success: false, error: 'academic.duplicateDocument' };
  if (learner.document === nextDocument) return { success: true };
  const entry: DocumentChangeLogEntry = { id: Date.now().toString(), learnerId, oldDocument: learner.document, previousDocument: learner.document, newDocument: nextDocument, changedAt: new Date().toISOString(), changedBy, reason };
  fichas = fichas.map(item => item.id === fichaId ? { ...item, learners: item.learners.map(other => other.id === learnerId ? { ...other, document: nextDocument, updatedAt: entry.changedAt, documentChangeLog: [...(other.documentChangeLog ?? []), entry] } : other), updatedAt: entry.changedAt } : item);
  emit();
  return { success: true };
}

export function correctInstitutionalLearnerStore(fichaId: string, learnerId: string, document: string, reason: string, changedBy?: string) {
  const normalizedReason = reason.trim();
  if (!normalizedReason) return { success: false, error: 'academic.correctionReasonRequired' };
  const result = updateLearnerDocument(fichaId, learnerId, document, changedBy, normalizedReason);
  if (!result.success) return result;
  markLearnerValidation(learnerId, 'validated');
  return { success: true };
}
