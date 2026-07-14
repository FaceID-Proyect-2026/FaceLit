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

export function deleteProgramStore(id: string) {
  const prog = programs.find(p => p.id === id);
  if (prog && prog.fichas.length > 0) return { success: false, error: 'El programa tiene fichas asociadas' };
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

export function unlinkFichaFromProgramStore(fichaId: string, programId: string) {
  programs = programs.map(p => (p.id === programId ? { ...p, fichas: p.fichas.filter(fid => fid !== fichaId) } : p));
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
