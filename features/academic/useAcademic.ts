// ─────────────────────────────────────────────
//  features/academic/useAcademic.ts
//  RF-3 V4 — Hook de Gestión Académica
//  Programas · Fichas · Aprendices · Instructores
// ─────────────────────────────────────────────
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import {
  addLearnerStore,
  assignInstructorToFichaStore,
  deactivateFichaStore,
  deactivateInstructorStore,
  deactivateLearnerStore,
  deactivateProgramStore,
  deleteFichaStore,
  deleteInstructorStore,
  deleteOrphanLearnerStore,
  deleteProgramStore,
  generateTransferCode,
  getFichaById,
  getFichasSnapshot,
  getInstructorById,
  getInstructorsByFichaId,
  getInstructorsSnapshot,
  getOrphanLearnersSnapshot,
  getProgramById,
  getProgramsSnapshot,
  joinFichaByCodeStore,
  joinFichaByTransferCodeStore,
  linkFichaToProgramStore,
  markLearnerValidation,
  moveLearnerToOrphanPoolStore,
  reactivateFichaStore,
  reactivateInstructorStore,
  reactivateLearnerStore,
  reactivateProgramStore,
  regenerateTransferCodeStore,
  registerFicha,
  registerInstructorStore,
  registerProgram,
  removeLearnerStore,
  subscribe,
  unassignInstructorFromFichaStore,
  unlinkFichaFromProgramStore,
  updateFichaStore,
  updateInstructorStore,
  updateLearnerInfoStore,
  updateProgramStore
} from './academicStore';
import { Ficha, InstructorType, Program, ValidationStatus } from './types';

export type ProgramStatusFilter    = 'all' | Program['status'];
export type InstructorStatusFilter = 'all' | 'active' | 'inactive';

export function useAcademic() {
  const programs    = useSyncExternalStore(subscribe, getProgramsSnapshot);
  const fichas      = useSyncExternalStore(subscribe, getFichasSnapshot);
  const instructors = useSyncExternalStore(subscribe, getInstructorsSnapshot);
  const orphanLearners = useSyncExternalStore(subscribe, getOrphanLearnersSnapshot);

  const [search, setSearch]                     = useState('');
  const [statusFilter, setStatusFilter]         = useState<ProgramStatusFilter>('all');
  const [instructorFilter, setInstructorFilter] = useState<InstructorStatusFilter>('all');

  // ── Programas filtrados ───────────────────
  const filteredPrograms = useMemo(() => {
    let list = programs;
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [programs, search, statusFilter]);

  // ── Fichas filtradas ──────────────────────
  const filteredFichas = useMemo(() => {
    if (!search.trim()) return fichas;
    const q = search.toLowerCase();
    return fichas.filter(f => f.number.includes(q) || f.code.toLowerCase().includes(q));
  }, [fichas, search]);

  const unlinkedFichas = useMemo(() => fichas.filter(f => !f.programId), [fichas]);

  // ── Instructores filtrados ────────────────
  const filteredInstructors = useMemo(() => {
    let list = instructors;
    if (instructorFilter !== 'all') list = list.filter(i => i.status === instructorFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.lastname.toLowerCase().includes(q) ||
          i.document.includes(q),
      );
    }
    return list;
  }, [instructors, search, instructorFilter]);

  // ── Getters por ID ────────────────────────
  const getProgram    = useCallback((id: string) => getProgramById(id), []);
  const getFicha      = useCallback((id: string) => getFichaById(id), []);
  const getInstructor = useCallback((id: string) => getInstructorById(id), []);

  // ── Acciones — Programas ──────────────────
  const addProgram        = useCallback((name: string) => registerProgram(name), []);
  const updateProgram     = useCallback((id: string, name: string, status: 'active' | 'inactive') => updateProgramStore(id, name, status), []);
  const deactivateProgram = useCallback((id: string) => deactivateProgramStore(id), []);
  const reactivateProgram = useCallback((id: string) => reactivateProgramStore(id), []);
  const deleteProgram     = useCallback((id: string) => deleteProgramStore(id), []);

  // ── Acciones — Fichas ─────────────────────
  const addFicha            = useCallback((number: string, jornada: Ficha['jornada'], programId: string) => registerFicha(number, jornada, programId), []);
  const updateFicha         = useCallback((id: string, data: Partial<Ficha>) => updateFichaStore(id, data), []);
  const deleteFicha         = useCallback((id: string) => deleteFichaStore(id), []);
  const deactivateFicha     = useCallback((id: string) => deactivateFichaStore(id), []);
  const reactivateFicha     = useCallback((id: string) => reactivateFichaStore(id), []);
  const unlinkFichaFromProgram = useCallback((fichaId: string, programId: string) => unlinkFichaFromProgramStore(fichaId, programId), []);
  const linkFichaToProgram  = useCallback((fichaId: string, programId: string) => linkFichaToProgramStore(fichaId, programId), []);
  /** RF-3.3 §10 — Regenera el transferCode de una ficha (invalida el anterior). */
  const regenerateTransferCode = useCallback((fichaId: string) => regenerateTransferCodeStore(fichaId), []);

  // ── Acciones — Aprendices ─────────────────
  const addLearner          = useCallback((fichaId: string, learner: Ficha['learners'][0]) => addLearnerStore(fichaId, learner), []);
  const removeLearner       = useCallback((fichaId: string, learnerId: string) => removeLearnerStore(fichaId, learnerId), []);
  const deactivateLearner   = useCallback((fichaId: string, learnerId: string) => deactivateLearnerStore(fichaId, learnerId), []);
  const reactivateLearner   = useCallback((fichaId: string, learnerId: string) => reactivateLearnerStore(fichaId, learnerId), []);
  const updateLearnerInfo   = useCallback(
    (fichaId: string, learnerId: string, data: { name?: string; lastname?: string; email?: string; document?: string }) =>
      updateLearnerInfoStore(fichaId, learnerId, data),
    [],
  );
  const markValidation      = useCallback((learnerId: string, status: ValidationStatus) => markLearnerValidation(learnerId, status), []);
  const moveLearnerToOrphanPool = useCallback((fichaId: string, learnerId: string) => moveLearnerToOrphanPoolStore(fichaId, learnerId), []);
  const deleteOrphanLearner = useCallback((learnerId: string) => deleteOrphanLearnerStore(learnerId), []);
  const joinFichaByTransferCode = useCallback(
    (learnerId: string, transferCode: string) => joinFichaByTransferCodeStore(learnerId, transferCode),
    [],
  );

  /** Compatibilidad con flujo legacy (code interno / número de ficha) */
  const joinFichaByCode = useCallback(
    (learnerId: string, code: string) => joinFichaByCodeStore(learnerId, code),
    [],
  );

  // ── Acciones — Instructores ───────────────
  const addInstructor = useCallback(
    (data: { name: string; lastname: string; document: string; email: string; instructorType: InstructorType; programId?: string; fichaIds?: string[] }) =>
      registerInstructorStore(data),
    [],
  );
  const updateInstructor            = useCallback((id: string, data: Parameters<typeof updateInstructorStore>[1]) => updateInstructorStore(id, data), []);
  const deactivateInstructor        = useCallback((id: string) => deactivateInstructorStore(id), []);
  const reactivateInstructor        = useCallback((id: string) => reactivateInstructorStore(id), []);
  const deleteInstructor            = useCallback((id: string) => deleteInstructorStore(id), []);
  const assignInstructorToFicha     = useCallback((instructorId: string, fichaId: string) => assignInstructorToFichaStore(instructorId, fichaId), []);
  const unassignInstructorFromFicha = useCallback((instructorId: string, fichaId: string) => unassignInstructorFromFichaStore(instructorId, fichaId), []);
  const getInstructorsForFicha      = useCallback((fichaId: string) => getInstructorsByFichaId(fichaId), []);

  return {
    // Estado
    programs: filteredPrograms,
    fichas: filteredFichas,
    allFichas: fichas,
    unlinkedFichas,
    orphanLearners,
    instructors: filteredInstructors,
    allInstructors: instructors,
    search, setSearch,
    statusFilter, setStatusFilter,
    instructorFilter, setInstructorFilter,

    // Getters
    getProgram, getFicha, getInstructor,

    // Programas
    addProgram, updateProgram, deactivateProgram, reactivateProgram, deleteProgram,

    // Fichas
    addFicha, updateFicha, deleteFicha, deactivateFicha, reactivateFicha,
    unlinkFichaFromProgram, linkFichaToProgram, regenerateTransferCode,

    // Aprendices
    addLearner, removeLearner, deactivateLearner, reactivateLearner,
    updateLearnerInfo, markValidation,
    moveLearnerToOrphanPool, joinFichaByTransferCode, joinFichaByCode,
    deleteOrphanLearner,

    // Instructores
    addInstructor, updateInstructor, deactivateInstructor, reactivateInstructor, deleteInstructor,
    assignInstructorToFicha, unassignInstructorFromFicha, getInstructorsForFicha,

    // Utilidades
    generateTransferCode,
  };
}
