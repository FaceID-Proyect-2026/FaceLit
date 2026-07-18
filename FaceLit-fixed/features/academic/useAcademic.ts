// ─────────────────────────────────────────────
//  features/academic/useAcademic.ts
//  Hook con lógica CRUD de Programas y Fichas.
//  Usa un store externo compartido (academicStore) para que
//  listado/registro/detalle siempre vean los mismos datos,
//  sin importar cuántas veces se invoque este hook — igual
//  que useEnvironments con environmentsStore.
// ─────────────────────────────────────────────
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { Ficha, Program } from './types';
import {
  subscribe,
  getProgramsSnapshot,
  getFichasSnapshot,
  getProgramById,
  getFichaById,
  registerProgram,
  updateProgramStore,
  deactivateProgramStore,
  deleteProgramStore,
  registerFicha,
  updateFichaStore,
  deleteFichaStore,
  unlinkFichaFromProgramStore,
  addLearnerStore,
  removeLearnerStore,
} from './academicStore';

export type ProgramStatusFilter = 'all' | Program['status'];

export function useAcademic() {
  const programs = useSyncExternalStore(subscribe, getProgramsSnapshot);
  const fichas = useSyncExternalStore(subscribe, getFichasSnapshot);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProgramStatusFilter>('all');

  const filteredPrograms = useMemo(() => {
    let list = programs;
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [programs, search, statusFilter]);

  const filteredFichas = useMemo(() => {
    if (!search.trim()) return fichas;
    const q = search.toLowerCase();
    return fichas.filter(f => f.number.includes(q) || f.code.toLowerCase().includes(q));
  }, [fichas, search]);

  const getProgram = useCallback((id: string) => getProgramById(id), [programs]);
  const getFicha = useCallback((id: string) => getFichaById(id), [fichas]);

  const addProgram = useCallback((name: string) => registerProgram(name), []);
  const updateProgram = useCallback((id: string, name: string, status: 'active' | 'inactive') => updateProgramStore(id, name, status), []);
  const deactivateProgram = useCallback((id: string) => deactivateProgramStore(id), []);
  const deleteProgram = useCallback((id: string) => deleteProgramStore(id), []);

  const addFicha = useCallback((number: string, jornada: Ficha['jornada'], programId: string) => registerFicha(number, jornada, programId), []);
  const updateFicha = useCallback((id: string, data: Partial<Ficha>) => updateFichaStore(id, data), []);
  const deleteFicha = useCallback((id: string) => deleteFichaStore(id), []);

  const unlinkFichaFromProgram = useCallback((fichaId: string, programId: string) => unlinkFichaFromProgramStore(fichaId, programId), []);
  const addLearner = useCallback((fichaId: string, learner: Ficha['learners'][0]) => addLearnerStore(fichaId, learner), []);
  const removeLearner = useCallback((fichaId: string, learnerId: string) => removeLearnerStore(fichaId, learnerId), []);

  return {
    programs: filteredPrograms, fichas: filteredFichas, allFichas: fichas,
    search, setSearch, statusFilter, setStatusFilter, getProgram, getFicha,
    addProgram, updateProgram, deactivateProgram, deleteProgram,
    addFicha, updateFicha, deleteFicha,
    unlinkFichaFromProgram, addLearner, removeLearner,
  };
}
