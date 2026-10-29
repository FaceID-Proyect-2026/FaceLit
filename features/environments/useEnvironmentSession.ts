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

function timeToSessionDate(time: string, baseDate = new Date(), mustBeAfter?: Date) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes || 0, 0, 0);

  if (mustBeAfter && date.getTime() <= mustBeAfter.getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function isTimeInFuture(time: string, baseDate = new Date()) {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;
  const candidate = new Date(baseDate);
  candidate.setHours(hours, minutes, 0, 0);
  return candidate.getTime() > baseDate.getTime();
}

export function useEnvironmentSession() {
  const [environmentQuery, setEnvironmentQueryState] = useState('');
  const [environments, setEnvironments] = useState<EnvironmentOption[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentOption | null>(null);
  const [instructors, setInstructors] = useState<SessionInstructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorIdState] = useState('');
  const [chips, setChips] = useState<SessionChip[]>([]);
  const [chipsLoading, setChipsLoading] = useState(false);
  const [chipsError, setChipsError] = useState(false);
  const [chipsRevision, setChipsRevision] = useState(0);
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
    setChipsError(false);
    setChipsLoading(!!selectedInstructorId);
    if (!selectedInstructorId) return () => { active = false; };
    fetchChipsForSessionInstructor(selectedInstructorId)
      .then(data => { if (active) setChips(data); })
      .catch(() => { if (active) setChipsError(true); })
      .finally(() => { if (active) setChipsLoading(false); });
    return () => { active = false; };
  }, [selectedInstructorId, chipsRevision]);

  const reloadChips = useCallback(() => setChipsRevision(revision => revision + 1), []);

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

  const setSelectedInstructorId = useCallback((id: string) => {
    if (id === selectedInstructorId) return;
    setSelectedInstructorIdState(id);
    setSelectedChipId('');
    setChips([]);
  }, [selectedInstructorId]);

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
    exitTime: string;
    shutdownTime: string;
  }) => {
    if (!selectedEnvironment || !selectedInstructorId || !selectedChipId) {
      return { success: false as const, error: 'facial.setup.validation.allRequired' };
    }
    const now = new Date();
    if (!isTimeInFuture(settings.exitTime, now)) {
      return { success: false as const, error: 'La hora de salida debe ser posterior a la hora actual.' };
    }
    if (!isTimeInFuture(settings.shutdownTime, now)) {
      return { success: false as const, error: 'La hora de apagado debe ser posterior a la hora actual.' };
    }
    if (settings.shutdownTime <= settings.exitTime) {
      return { success: false as const, error: 'La hora de apagado debe ser posterior a la hora de salida.' };
    }
    setSaving(true);
    try {
      const entryTime = new Date();
      const exitDate = timeToSessionDate(settings.exitTime, entryTime, entryTime);
      const shutdownDate = timeToSessionDate(settings.shutdownTime, exitDate, exitDate);
      const session = await createEnvironmentSession({
        idEnvironment: selectedEnvironment.idEnvironment,
        idInstructorInCharge: selectedInstructorId,
        idChip: selectedChipId,
        entryTime: entryTime.toISOString(),
        registrationMinutes: settings.registrationMinutes,
        exitTime: exitDate.toISOString(),
        shutdownTime: shutdownDate.toISOString(),
      });
      return { success: true as const, session };
    } catch (error: any) {
      return {
        success: false as const,
        error: error?.response?.data?.message ?? 'facial.setup.validation.saveFailed',
      };
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
    chipsLoading,
    chipsError,
    reloadChips,
    selectedChipId,
    setSelectedChipId,
    loading,
    saving,
    error,
    saveSession,
  };
}
