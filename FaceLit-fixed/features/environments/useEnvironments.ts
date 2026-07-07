// ─────────────────────────────────────────────
//  features/environments/useEnvironments.ts
//  Hook con lógica CRUD de ambientes
// ─────────────────────────────────────────────
import { useState, useCallback, useMemo } from 'react';
import { Environment, EnvironmentForm, MOCK_ENVIRONMENTS } from './types';

export function useEnvironments() {
  const [environments, setEnvironments] = useState<Environment[]>(MOCK_ENVIRONMENTS);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return environments;
    const q = search.toLowerCase();
    return environments.filter(
      e => e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)
    );
  }, [environments, search]);

  const getById = useCallback((id: string) => environments.find(e => e.id === id), [environments]);

  const register = useCallback((form: EnvironmentForm) => {
    const newEnv: Environment = {
      id: Date.now().toString(),
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type as Environment['type'],
      capacity: parseInt(form.capacity, 10) || 0,
      status: form.status,
      location: form.location.trim(),
      assignedFichas: [],
    };
    setEnvironments(prev => [...prev, newEnv]);
    return newEnv;
  }, []);

  const update = useCallback((id: string, form: EnvironmentForm) => {
    setEnvironments(prev => prev.map(e => e.id === id ? {
      ...e,
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type as Environment['type'],
      capacity: parseInt(form.capacity, 10) || 0,
      status: form.status,
      location: form.location.trim(),
    } : e));
  }, []);

  const remove = useCallback((id: string) => {
    const env = environments.find(e => e.id === id);
    if (env && env.assignedFichas.length > 0) {
      return { success: false, error: 'No se puede eliminar: tiene fichas activas' };
    }
    setEnvironments(prev => prev.filter(e => e.id !== id));
    return { success: true };
  }, [environments]);

  const assignFicha = useCallback((envId: string, fichaId: string) => {
    setEnvironments(prev => prev.map(e =>
      e.id === envId && !e.assignedFichas.includes(fichaId)
        ? { ...e, assignedFichas: [...e.assignedFichas, fichaId] }
        : e
    ));
    return { success: true };
  }, []);

  return { environments: filtered, search, setSearch, getById, register, update, remove, assignFicha };
}
