import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createEnvironmentSession,
  fetchChipsForSessionInstructor,
  fetchSessionInstructors,
  getOrCreateSessionEnvironment,
  searchSessionEnvironments,
  EnvironmentOption,
  SessionChip,
  SessionInstructor,
} from './environmentSessionApi';

export function useEnvironmentSession() {
  const [environmentQuery, setEnvironmentQueryState] = useState('');
  const [environments, setEnvironments] = useState<EnvironmentOption[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentOption | null>(null);
  const [instructors, setInstructors] = useState<SessionInstructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [chips, setChips] = useState<SessionChip[]>([]);
  const [selectedChipId, setSelectedChipId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchSessionInstructors()
      .then(data => { if (active) setInstructors(data); })
      .catch(() => { if (active) setError('facial.setup.validation.loadFailed'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      searchSessionEnvironments(environmentQuery)
        .then(data => { if (active) setEnvironments(data); })
        .catch(() => { if (active) setError('facial.setup.validation.loadFailed'); });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [environmentQuery]);

  useEffect(() => {
    let active = true;
    setSelectedChipId('');
    setChips([]);
    if (!selectedInstructorId) return () => { active = false; };
    fetchChipsForSessionInstructor(selectedInstructorId)
      .then(data => { if (active) setChips(data); })
      .catch(() => { if (active) setError('facial.setup.validation.loadFailed'); });
    return () => { active = false; };
  }, [selectedInstructorId]);

  const exactEnvironmentMatch = useMemo(() => {
    const query = environmentQuery.trim().toLowerCase();
    if (!query) return false;
    return environments.some(item => item.environmentName.trim().toLowerCase() === query);
  }, [environmentQuery, environments]);

  const selectEnvironment = useCallback((environment: EnvironmentOption) => {
    setSelectedEnvironment(environment);
    setEnvironmentQueryState(environment.environmentName);
  }, []);

  const setEnvironmentQuery = useCallback((value: string) => {
    setEnvironmentQueryState(value);
    setSelectedEnvironment(current =>
      current && current.environmentName.trim().toLowerCase() === value.trim().toLowerCase()
        ? current
        : null,
    );
  }, []);

  const createEnvironment = useCallback(async () => {
    const name = environmentQuery.trim();
    if (!name) return null;
    const environment = await getOrCreateSessionEnvironment(name);
    setSelectedEnvironment(environment);
    setEnvironmentQueryState(environment.environmentName);
    setEnvironments(prev => [environment, ...prev.filter(item => item.idEnvironment !== environment.idEnvironment)]);
    return environment;
  }, [environmentQuery]);

  const saveSession = useCallback(async (settings: {
    registrationMinutes: number;
    exitTime?: string;
    shutdownTime?: string;
  }) => {
    if (!selectedEnvironment || !selectedInstructorId || !selectedChipId) {
      return { success: false as const, error: 'facial.setup.validation.allRequired' };
    }
    setSaving(true);
    try {
      const session = await createEnvironmentSession({
        idEnvironment: selectedEnvironment.idEnvironment,
        idInstructorInCharge: selectedInstructorId,
        idChip: selectedChipId,
        registrationMinutes: settings.registrationMinutes,
        exitTime: settings.exitTime,
        shutdownTime: settings.shutdownTime,
      });
      return { success: true as const, session };
    } catch {
      return { success: false as const, error: 'facial.setup.validation.saveFailed' };
    } finally {
      setSaving(false);
    }
  }, [selectedEnvironment, selectedInstructorId, selectedChipId]);

  return {
    environmentQuery,
    setEnvironmentQuery,
    environments,
    selectedEnvironment,
    selectEnvironment,
    createEnvironment,
    exactEnvironmentMatch,
    instructors,
    selectedInstructorId,
    setSelectedInstructorId,
    chips,
    selectedChipId,
    setSelectedChipId,
    loading,
    saving,
    error,
    saveSession,
  };
}
