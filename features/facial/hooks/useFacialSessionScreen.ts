import { useEnvironmentSession } from '@/features/environments/useEnvironmentSession';
import { fetchCurrentActiveEnvironmentSession } from '@/features/environments/environmentSessionApi';
import { useFacialRegistry } from '@/features/facial/useFacialRegistry';
import { Routes } from '@/shared/constants/routes';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useAppDialog } from '@/shared/hooks/useAppDialog';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';

export function useFacialSessionScreen() {
  const { logout, user } = useAuth();
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const {
    config,
    sectionDraft,
    settings,
    activeSession,
    saveConfig,
    saveSectionDraft,
    saveSettings,
    setActiveSession,
  } = useFacialRegistry(user?.id);
  const { alert, DialogUI } = useAppDialog();
  const {
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
    saveSession,
  } = useEnvironmentSession();
  useFocusEffect(useCallback(() => { reloadChips(); }, [reloadChips]));
  const restoredConfigRef = useRef(false);
  const remoteSessionKeyRef = useRef<string | null>(null);

  const syncRemoteSession = useCallback(async () => {
    const session = await fetchCurrentActiveEnvironmentSession();
    if (!session) {
      // Un fallo temporal o una respuesta vacía no debe borrar una sesión
      // todavía vigente que fue creada en este navegador. Solo se limpia
      // cuando la copia local también ya superó su shutdown_time.
      const localShutdown = activeSession?.shutdownTime
        ? new Date(activeSession.shutdownTime).getTime()
        : NaN;
      if (Number.isFinite(localShutdown) && localShutdown > Date.now()) return;
      if (!activeSession) return;

      // El backend desactiva las sesiones vencidas. Limpiar también la copia
      // local evita mostrar "Continuar" cuando la jornada ya terminó.
      remoteSessionKeyRef.current = null;
      setActiveSession(undefined);
      return;
    }

    const remoteSessionKey = [
      session.idRecordEnvironment,
      session.idEnvironment,
      session.idInstructorScheduled,
      session.idChip,
      session.exitTime,
      session.shutdownTime,
    ].join('|');
    if (remoteSessionKeyRef.current === remoteSessionKey) return;
    remoteSessionKeyRef.current = remoteSessionKey;

    // Permite que una configuración creada o actualizada desde otro
    // navegador reemplace la copia local de este navegador.
    restoredConfigRef.current = false;
    setActiveSession({
      idRecordEnvironment: session.idRecordEnvironment,
      idEnvironment: session.idEnvironment,
      environmentName: session.environmentName,
      idDevice: session.idDevice,
      deviceCode: session.deviceCode,
      idChip: session.idChip,
      chipCode: session.chipCode,
      idInstructorScheduled: session.idInstructorScheduled,
      instructorScheduledName: session.instructorScheduledName,
      idInstructorInCharge: session.idInstructorInCharge,
      instructorInChargeName: session.instructorInChargeName,
      shutdownTime: session.shutdownTime,
      active: session.active,
    });
    selectEnvironment({
      idEnvironment: session.idEnvironment,
      environmentName: session.environmentName,
    });
    setSelectedInstructorId(session.idInstructorScheduled);

    // La configuración de la sesión vive en el backend, no en el navegador
    // que la creó. Así otro navegador puede reconstruir el formulario y
    // mostrar la misma sesión activa.
    void saveConfig({
      environmentId: session.idEnvironment,
      environmentName: session.environmentName,
      instructorId: session.idInstructorScheduled,
      instructorName: session.instructorScheduledName,
      fichaId: session.idChip,
      fichaNumber: session.chipCode,
    });
    void saveSectionDraft({
      environmentId: session.idEnvironment,
      environmentName: session.environmentName,
      instructorId: session.idInstructorScheduled,
      fichaId: session.idChip,
    });
    void saveSettings({
      registrationMinutes: session.registrationMinutes,
      exitTime: new Date(session.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      shutdownTime: new Date(session.shutdownTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    });
  }, [activeSession, saveConfig, saveSectionDraft, saveSettings, selectEnvironment, setActiveSession, setSelectedInstructorId]);

  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void syncRemoteSession().catch(() => undefined);
    };
    refresh();
    const timer = setInterval(() => {
      if (mounted) refresh();
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [syncRemoteSession]);

  useEffect(() => {
    if (!activeSession || !chips.some(chip => chip.idChip === activeSession.idChip)) return;
    if (selectedChipId !== activeSession.idChip) {
      setSelectedChipId(activeSession.idChip);
    }
  }, [activeSession, chips, selectedChipId, setSelectedChipId]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.history?.pushState) return;

    window.history.pushState({ facialBackGuard: true }, "", window.location.href);

    const handleBrowserBack = async () => {
      window.history.pushState({ facialBackGuard: true }, "", window.location.href);
      await logout();
      router.replace(Routes.AUTH.LOGIN as any);
    };

    window.addEventListener("popstate", handleBrowserBack);
    return () => window.removeEventListener("popstate", handleBrowserBack);
  }, [logout]);

  useEffect(() => {
    const savedSection = sectionDraft ?? config;
    if (restoredConfigRef.current || !savedSection) return;
    if (selectedEnvironment || selectedInstructorId || selectedChipId) return;
    if (!savedSection.environmentId || !savedSection.environmentName) return;

    selectEnvironment({
      idEnvironment: savedSection.environmentId,
      environmentName: savedSection.environmentName,
    });
    if (savedSection.instructorId) {
      setSelectedInstructorId(savedSection.instructorId);
    }
    restoredConfigRef.current = true;
  }, [
    config,
    sectionDraft,
    selectEnvironment,
    selectedChipId,
    selectedEnvironment,
    selectedInstructorId,
    setSelectedInstructorId,
  ]);

  useEffect(() => {
    const savedSection = sectionDraft ?? config;
    if (!savedSection || !restoredConfigRef.current || selectedChipId) return;
    if (!savedSection.fichaId || selectedInstructorId !== savedSection.instructorId) return;
    if (!chips.some((chip) => chip.idChip === savedSection.fichaId)) return;

    setSelectedChipId(savedSection.fichaId);
  }, [chips, config, sectionDraft, selectedChipId, selectedInstructorId, setSelectedChipId]);

    return {
    theme,
    isDark,
    t,
    width,
    settings,
    activeSession,
    saveConfig,
    saveSectionDraft,
    setActiveSession,
    alert,
    DialogUI,
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
    saveSession,
  };
}
