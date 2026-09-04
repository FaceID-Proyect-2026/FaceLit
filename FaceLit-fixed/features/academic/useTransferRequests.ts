import { useCallback, useSyncExternalStore } from 'react';
import { approveTransferRequest, createTransferRequest, getTransferRequestsSnapshot, rejectTransferRequest, subscribe } from './transferRequestStore';

export function useTransferRequests() {
  const requests = useSyncExternalStore(subscribe, getTransferRequestsSnapshot);
  return {
    requests,
    create: useCallback(createTransferRequest, []),
    approve: useCallback(approveTransferRequest, []),
    reject: useCallback(rejectTransferRequest, []),
  };
}