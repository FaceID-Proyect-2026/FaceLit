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
import { Ficha, JornadaType, Learner, MOCK_FICHAS, MOCK_PROGRAMS, Program } from './types';

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
  const p: Program = { id: Date.now().toString(), name: name.trim(), status: 'active', fichas: [] };
  programs = [...programs, p];
  emit();
  return p;
}

export function updateProgramStore(id: string, name: string, status: 'active' | 'inactive') {
  programs = programs.map(p => (p.id === id ? { ...p, name: name.trim(), status } : p));
  emit();
}

// Desactivación lógica: cambia el estado a Inactivo pero conserva el registro
// y su información (fichas asociadas, etc.).
export function deactivateProgramStore(id: string) {
  const prog = programs.find(p => p.id === id);
  if (!prog) return { success: false, error: 'academic.programNotFound' };
  programs = programs.map(p => (p.id === id ? { ...p, status: 'inactive' as const } : p));
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
  const f: Ficha = {
    id: Date.now().toString(),
    number: number.trim(),
    jornada,
    status: 'active',
    programId,
    code: `FCH-${Date.now().toString().slice(-6)}`,
    learners: [],
  };
  fichas = [...fichas, f];
  programs = programs.map(p => (p.id === programId ? { ...p, fichas: [...p.fichas, f.id] } : p));
  emit();
  return f;
}

export function updateFichaStore(id: string, data: Partial<Ficha>) {
  fichas = fichas.map(f => (f.id === id ? { ...f, ...data } : f));
  emit();
}

export function deleteFichaStore(id: string) {
  fichas = fichas.filter(f => f.id !== id);
  programs = programs.map(p => ({ ...p, fichas: p.fichas.filter(fid => fid !== id) }));
  emit();
  return { success: true };
}

// Desvincula la ficha del programa: solo se elimina la relación
// (tanto en el arreglo `fichas` del programa como en `programId` de la
// ficha). La ficha y su información (código, aprendices, etc.) se
// conservan intactas y quedan disponibles para vincularse nuevamente.
export function unlinkFichaFromProgramStore(fichaId: string, programId: string) {
  programs = programs.map(p => (p.id === programId ? { ...p, fichas: p.fichas.filter(fid => fid !== fichaId) } : p));
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, programId: '' } : f));
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
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, programId } : f));
  programs = programs.map(p => (p.id === programId && !p.fichas.includes(fichaId) ? { ...p, fichas: [...p.fichas, fichaId] } : p));
  emit();
  return { success: true };
}

export function addLearnerStore(fichaId: string, learner: Learner) {
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, learners: [...f.learners, learner] } : f));
  emit();
}

export function removeLearnerStore(fichaId: string, learnerId: string) {
  fichas = fichas.map(f => (f.id === fichaId ? { ...f, learners: f.learners.filter(l => l.id !== learnerId) } : f));
  emit();
}
