// ─────────────────────────────────────────────
//  features/academic/useAcademic.ts
// ─────────────────────────────────────────────
import { useState, useCallback, useMemo } from 'react';
import { Program, Ficha, MOCK_PROGRAMS, MOCK_FICHAS } from './types';

export function useAcademic() {
  const [programs, setPrograms] = useState<Program[]>(MOCK_PROGRAMS);
  const [fichas, setFichas] = useState<Ficha[]>(MOCK_FICHAS);
  const [search, setSearch] = useState('');

  const filteredPrograms = useMemo(() => {
    if (!search.trim()) return programs;
    const q = search.toLowerCase();
    return programs.filter(p => p.name.toLowerCase().includes(q));
  }, [programs, search]);

  const filteredFichas = useMemo(() => {
    if (!search.trim()) return fichas;
    const q = search.toLowerCase();
    return fichas.filter(f => f.number.includes(q) || f.code.toLowerCase().includes(q));
  }, [fichas, search]);

  const getProgram = useCallback((id: string) => programs.find(p => p.id === id), [programs]);
  const getFicha = useCallback((id: string) => fichas.find(f => f.id === id), [fichas]);

  const addProgram = useCallback((name: string) => {
    const p: Program = { id: Date.now().toString(), name: name.trim(), status: 'active', fichas: [] };
    setPrograms(prev => [...prev, p]);
    return p;
  }, []);

  const updateProgram = useCallback((id: string, name: string, status: 'active' | 'inactive') => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, name: name.trim(), status } : p));
  }, []);

  const deleteProgram = useCallback((id: string) => {
    const prog = programs.find(p => p.id === id);
    if (prog && prog.fichas.length > 0) return { success: false, error: 'El programa tiene fichas asociadas' };
    setPrograms(prev => prev.filter(p => p.id !== id));
    return { success: true };
  }, [programs]);

  const addFicha = useCallback((number: string, jornada: Ficha['jornada'], programId: string) => {
    const f: Ficha = {
      id: Date.now().toString(),
      number: number.trim(),
      jornada,
      status: 'active',
      programId,
      code: `FCH-${Date.now().toString().slice(-6)}`,
      learners: [],
    };
    setFichas(prev => [...prev, f]);
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, fichas: [...p.fichas, f.id] } : p));
    return f;
  }, []);

  const updateFicha = useCallback((id: string, data: Partial<Ficha>) => {
    setFichas(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  }, []);

  const deleteFicha = useCallback((id: string) => {
    setFichas(prev => prev.filter(f => f.id !== id));
    setPrograms(prev => prev.map(p => ({ ...p, fichas: p.fichas.filter(fid => fid !== id) })));
    return { success: true };
  }, []);

  const unlinkFichaFromProgram = useCallback((fichaId: string, programId: string) => {
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, fichas: p.fichas.filter(fid => fid !== fichaId) } : p));
    return { success: true };
  }, []);

  const addLearner = useCallback((fichaId: string, learner: Ficha['learners'][0]) => {
    setFichas(prev => prev.map(f => f.id === fichaId ? { ...f, learners: [...f.learners, learner] } : f));
  }, []);

  const removeLearner = useCallback((fichaId: string, learnerId: string) => {
    setFichas(prev => prev.map(f => f.id === fichaId ? { ...f, learners: f.learners.filter(l => l.id !== learnerId) } : f));
  }, []);

  return {
    programs: filteredPrograms, fichas: filteredFichas, allFichas: fichas,
    search, setSearch, getProgram, getFicha,
    addProgram, updateProgram, deleteProgram,
    addFicha, updateFicha, deleteFicha,
    unlinkFichaFromProgram, addLearner, removeLearner,
  };
}
