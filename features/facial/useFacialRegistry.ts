import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
    getFacialConfigSnapshot,
    getFacialEventsSnapshot,
    getFacialRecordsSnapshot,
    getFacialSettingsSnapshot,
    getActiveFacialSessionSnapshot,
    hydrateFacialConfig,
    hydrateFacialSettings,
    registerFacialCapture,
    registerFacialEvent,
    saveFacialConfig,
    saveFacialSettings,
    setFacialOwner,
    setActiveFacialSession,
    subscribeFacial,
} from "./facialStore";
import { FacialConfig, FacialSession, FacialSettings, FacialUser } from "./types";

export function useFacialRegistry(ownerId?: string | null) {
  useEffect(() => {
    setFacialOwner(ownerId);
    hydrateFacialConfig(ownerId);
    hydrateFacialSettings(ownerId);
  }, [ownerId]);

  const records = useSyncExternalStore(
    subscribeFacial,
    getFacialRecordsSnapshot,
  );
  const events = useSyncExternalStore(subscribeFacial, getFacialEventsSnapshot);
  const config = useSyncExternalStore(subscribeFacial, getFacialConfigSnapshot);
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
