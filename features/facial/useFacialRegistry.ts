import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
    getFacialConfigSnapshot,
    getFacialSectionDraftSnapshot,
    getFacialEventsSnapshot,
    getFacialRecordsSnapshot,
    getFacialSettingsSnapshot,
    getActiveFacialSessionSnapshot,
    hydrateFacialConfig,
    hydrateFacialSectionDraft,
    hydrateFacialSettings,
    registerFacialCapture,
    registerFacialEvent,
    saveFacialConfig,
    saveFacialSectionDraft,
    saveFacialSettings,
    setFacialOwner,
    setActiveFacialSession,
    subscribeFacial,
} from "./facialStore";
import { FacialConfig, FacialSectionDraft, FacialSession, FacialSettings, FacialUser } from "./types";

export function useFacialRegistry(ownerId?: string | null) {
  useEffect(() => {
    setFacialOwner(ownerId);
    hydrateFacialConfig(ownerId);
    hydrateFacialSectionDraft(ownerId);
    hydrateFacialSettings(ownerId);
  }, [ownerId]);

  const records = useSyncExternalStore(
    subscribeFacial,
    getFacialRecordsSnapshot,
  );
  const events = useSyncExternalStore(subscribeFacial, getFacialEventsSnapshot);
  const config = useSyncExternalStore(subscribeFacial, getFacialConfigSnapshot);
  const sectionDraft = useSyncExternalStore(
    subscribeFacial,
    getFacialSectionDraftSnapshot,
  );
  const settings = useSyncExternalStore(
    subscribeFacial,
    getFacialSettingsSnapshot,
  );
  const activeSession = useSyncExternalStore(
    subscribeFacial,
    getActiveFacialSessionSnapshot,
  );
  return {
    records,
    events,
    config,
    sectionDraft,
    settings,
    activeSession,
    registerCapture: useCallback(
      (
        user: FacialUser | undefined,
        captureUri: string | null,
        trainingSucceeded?: boolean,
      ) => registerFacialCapture(user, captureUri, trainingSucceeded),
      [],
    ),
    registerEvent: useCallback(registerFacialEvent, []),
    saveConfig: useCallback(
      (nextConfig: FacialConfig) => saveFacialConfig(nextConfig, ownerId),
      [ownerId],
    ),
    saveSectionDraft: useCallback(
      (nextDraft: FacialSectionDraft) => saveFacialSectionDraft(nextDraft, ownerId),
      [ownerId],
    ),
    saveSettings: useCallback(
      (nextSettings: FacialSettings) => saveFacialSettings(nextSettings, ownerId),
      [ownerId],
    ),
    setActiveSession: useCallback(
      (session: FacialSession | undefined) => setActiveFacialSession(session, ownerId),
      [ownerId],
    ),
  };
}
