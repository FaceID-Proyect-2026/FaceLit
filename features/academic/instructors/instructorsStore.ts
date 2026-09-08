// ─────────────────────────────────────────────
//  features/academic/instructors/instructorsStore.ts
//  Store compartido para el catálogo de Instructores — mismo patrón
//  que el resto de módulos (academicStore, environmentsStore...).
// ─────────────────────────────────────────────
import { getAreaById } from '../areas/areasStore';
import { getTransversalById } from '../transversals/transversalsStore';
import { getProgramById } from '../academicStore';
import { Instructor, InstructorType, MOCK_INSTRUCTORS_PROFILES } from './types';

type Listener = () => void;

let instructors: Instructor[] = MOCK_INSTRUCTORS_PROFILES;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(l => l());
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getInstructorsSnapshot() {
  return instructors;
}

export function getInstructorById(id: string) {
  return instructors.find(i => i.id === id);
}

export function findInstructorByDocument(document: string) {
  return instructors.find(i => i.document === document);
}

export interface InstructorInput {
  name: string;
  lastname: string;
  document: string;
  email?: string;
  type: InstructorType;
  areaId?: string;
  transversalIds?: string[];
}

function validateInstructorInput(input: InstructorInput, excludeId?: string): string | null {
  if (!input.name.trim() || !input.lastname.trim()) return 'academic.instructors.nameRequired';
  if (!input.document.trim()) return 'academic.instructors.documentRequired';
  const duplicate = instructors.some(i => i.id !== excludeId && i.document === input.document.trim());
  if (duplicate) return 'academic.instructors.duplicateDocument';
  if (input.type === 'ESPECIFICO') {
    if (!input.areaId) return 'academic.instructors.areaRequired';
    if (!getAreaById(input.areaId)) return 'academic.instructors.areaNotFound';
  } else {
    if (!input.transversalIds || input.transversalIds.length === 0) return 'academic.instructors.transversalRequired';
    const missing = input.transversalIds.find(id => !getTransversalById(id));
    if (missing) return 'academic.instructors.transversalNotFound';
  }
  return null;
}

export function registerInstructor(input: InstructorInput) {
  const error = validateInstructorInput(input);
  if (error) return { success: false as const, error };
  const now = new Date().toISOString();
  const instructor: Instructor = {
    id: `inst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    lastname: input.lastname.trim(),
    document: input.document.trim(),
    email: input.email?.trim(),
    type: input.type,
    areaId: input.type === 'ESPECIFICO' ? input.areaId : undefined,
    transversalIds: input.type === 'TRANSVERSAL' ? [...new Set(input.transversalIds ?? [])] : [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  instructors = [...instructors, instructor];
  emit();
  return { success: true as const, instructor };
}

export function updateInstructorStore(id: string, input: InstructorInput) {
  const existing = instructors.find(i => i.id === id);
  if (!existing) return { success: false as const, error: 'academic.instructors.notFound' };
  const error = validateInstructorInput(input, id);
  if (error) return { success: false as const, error };
  instructors = instructors.map(i => (i.id === id ? {
    ...i,
    name: input.name.trim(),
    lastname: input.lastname.trim(),
    document: input.document.trim(),
    email: input.email?.trim(),
    type: input.type,
    areaId: input.type === 'ESPECIFICO' ? input.areaId : undefined,
    transversalIds: input.type === 'TRANSVERSAL' ? [...new Set(input.transversalIds ?? [])] : [],
    updatedAt: new Date().toISOString(),
  } : i));
  emit();
  return { success: true as const };
}

// Desactivación lógica (no se elimina: puede tener horarios asociados y
// hay que conservar la trazabilidad — Prompt maestro, sección 25.22).
export function deactivateInstructorStore(id: string) {
  const existing = instructors.find(i => i.id === id);
  if (!existing) return { success: false as const, error: 'academic.instructors.notFound' };
  instructors = instructors.map(i => (i.id === id ? { ...i, status: 'inactive' as const, updatedAt: new Date().toISOString() } : i));
  emit();
  return { success: true as const };
}

export function reactivateInstructorStore(id: string) {
  const existing = instructors.find(i => i.id === id);
  if (!existing) return { success: false as const, error: 'academic.instructors.notFound' };
  instructors = instructors.map(i => (i.id === id ? { ...i, status: 'active' as const, updatedAt: new Date().toISOString() } : i));
  emit();
  return { success: true as const };
}

// ── Elegibilidad (Prompt maestro, secciones 5, 9 y 13) ──
// Elegibilidad != Disponibilidad: esto solo responde "¿puede dictar
// formación en este programa?", sin mirar horarios. La disponibilidad
// horaria vive en features/schedules/availability.ts.
export function isInstructorEligibleForProgram(instructor: Instructor, programId: string): boolean {
  if (instructor.status !== 'active') return false;
  const program = getProgramById(programId);
  if (!program) return false;

  if (instructor.type === 'ESPECIFICO') {
    return !!instructor.areaId && instructor.areaId === program.areaId;
  }
  // TRANSVERSAL: elegible si alguna de sus transversales está asociada al programa.
  return instructor.transversalIds.some(transversalId => {
    const transversal = getTransversalById(transversalId);
    return !!transversal && transversal.status === 'active' && transversal.programIds.includes(programId);
  });
}

export function getEligibleInstructorsForProgram(programId: string): Instructor[] {
  return instructors.filter(i => isInstructorEligibleForProgram(i, programId));
}
