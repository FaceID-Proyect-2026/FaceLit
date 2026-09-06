import { useCallback, useSyncExternalStore } from 'react';
import { getFacialEventsSnapshot, getFacialRecordsSnapshot, registerFacialCapture, registerFacialEvent, subscribeFacial } from './facialStore';
import { FacialUser } from './types';

export function useFacialRegistry() {
  const records = useSyncExternalStore(subscribeFacial, getFacialRecordsSnapshot);
  const events = useSyncExternalStore(subscribeFacial, getFacialEventsSnapshot);
  return {
    records,
    events,
    registerCapture: useCallback((user: FacialUser | undefined, captureUri: string | null, trainingSucceeded?: boolean) => registerFacialCapture(user, captureUri, trainingSucceeded), []),
    registerEvent: useCallback(registerFacialEvent, []),
  };
}
