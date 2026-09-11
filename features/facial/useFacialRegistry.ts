import { useCallback, useSyncExternalStore } from 'react';
import {
  getFacialConfigSnapshot,
  getFacialEventsSnapshot,
  getFacialRecordsSnapshot,
  getFacialSettingsSnapshot,
  registerFacialCapture,
  registerFacialEvent,
  saveFacialRecognitionSettings,
  saveFacialSessionConfig,
  subscribeFacial,
} from './facialStore';
import { FacialRecognitionSettings, FacialSessionConfig, FacialUser } from './types';

export function useFacialRegistry() {
  const records = useSyncExternalStore(subscribeFacial, getFacialRecordsSnapshot);
  const events = useSyncExternalStore(subscribeFacial, getFacialEventsSnapshot);
  const config = useSyncExternalStore(subscribeFacial, getFacialConfigSnapshot);
  const settings = useSyncExternalStore(subscribeFacial, getFacialSettingsSnapshot);
  return {
    records,
    events,
    config,
    settings,
    registerCapture: useCallback((user: FacialUser | undefined, captureUri: string | null, trainingSucceeded?: boolean) => registerFacialCapture(user, captureUri, trainingSucceeded), []),
    registerEvent: useCallback(registerFacialEvent, []),
    saveConfig: useCallback((data: Omit<FacialSessionConfig, 'id' | 'updatedAt'>) => saveFacialSessionConfig(data), []),
    saveSettings: useCallback((data: FacialRecognitionSettings) => saveFacialRecognitionSettings(data), []),
  };
}
