// ─────────────────────────────────────────────
//  features/academic/instructors/useInstructors.ts
// ─────────────────────────────────────────────
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import {
    deactivateInstructorStore,
    findInstructorByDocument,
    getEligibleInstructorsForProgram,
    getInstructorById,
    getInstructorsSnapshot,
    InstructorInput,
    isInstructorEligibleForProgram,
    reactivateInstructorStore,
    registerInstructor,
    subscribe,
    updateInstructorStore,
} from './instructorsStore';
import { getInstructorFullName, InstructorType } from './types';

export type InstructorTypeFilter = 'all' | InstructorType;

export function useInstructors() {
  const instructors = useSyncExternalStore(subscribe, getInstructorsSnapshot);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InstructorTypeFilter>('all');

  const filteredInstructors = useMemo(() => {
    let list = instructors;
    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => getInstructorFullName(i).toLowerCase().includes(q) || i.document.includes(q));
    }
    return list;
  }, [instructors, search, typeFilter]);

  const getInstructor = useCallback((id: string) => getInstructorById(id), []);
  const getByDocument = useCallback((document: string) => findInstructorByDocument(document), []);
  const addInstructor = useCallback((input: InstructorInput) => registerInstructor(input), []);
  const updateInstructor = useCallback((id: string, input: InstructorInput) => updateInstructorStore(id, input), []);
  const deactivateInstructor = useCallback((id: string) => deactivateInstructorStore(id), []);
  const reactivateInstructor = useCallback((id: string) => reactivateInstructorStore(id), []);
  const eligibleForProgram = useCallback((programId: string) => getEligibleInstructorsForProgram(programId), []);
  const isEligible = useCallback((instructorId: string, programId: string) => {
    const instructor = getInstructorById(instructorId);
    return !!instructor && isInstructorEligibleForProgram(instructor, programId);
  }, []);

  return {
    instructors: filteredInstructors, allInstructors: instructors,
    search, setSearch, typeFilter, setTypeFilter,
    getInstructor, getByDocument, addInstructor, updateInstructor,
    deactivateInstructor, reactivateInstructor, eligibleForProgram, isEligible,
  };
}
