// ─────────────────────────────────────────────
//  features/academic/useTransferRequests.ts
//  RF-3.3 V4 — Hook de solicitudes de traslado
// ─────────────────────────────────────────────
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
    approveTransferRequest,
    createTransferRequest,
    getTransferRequestsSnapshot,
    rejectTransferRequest,
    subscribe
} from './transferRequestStore';

export function useTransferRequests() {
  const requests = useSyncExternalStore(subscribe, getTransferRequestsSnapshot);

  const pendingRequests = useMemo(
    () => requests.filter(r => r.status === 'pending'),
    [requests],
  );

  const pendingCount = pendingRequests.length;

  return {
    requests,
    pendingRequests,
    pendingCount,
    /** Aprendiz crea solicitud ingresando el transferCode de la ficha destino */
    create:  useCallback(createTransferRequest, []),
    /** Coordinador aprueba — mueve al aprendiz a la ficha destino */
    approve: useCallback(approveTransferRequest, []),
    /** Coordinador rechaza — el aprendiz permanece en su ficha actual */
    reject:  useCallback(rejectTransferRequest, []),
  };
}
