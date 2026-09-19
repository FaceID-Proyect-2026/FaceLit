// ─────────────────────────────────────────────
//  features/academic/useTransferRequests.ts
//  RF-3.3 V4 — Hook de solicitudes de traslado
// ─────────────────────────────────────────────
import { useCallback, useEffect, useMemo, useState } from 'react';
import { acceptPendingTransfer, cancelPendingTransfer, fetchPendingTransfers } from './academicApi';
import type { TransferRequest } from './types';
import {
    approveTransferRequest,
    createTransferRequest,
    getTransferRequestsSnapshot,
    rejectTransferRequest,
    subscribe
} from './transferRequestStore';

export function useTransferRequests() {
  const [requests, setRequests] = useState<TransferRequest[]>([]);

  const reload = useCallback(async () => {
    const pending = await fetchPendingTransfers();
    setRequests(pending.map(item => ({
      id: item.idPendingTransfer,
      learnerId: item.idUser,
      learnerName: item.aprendiz,
      learnerDocument: '',
      learnerFicha: item.fichaActual,
      currentFichaId: '',
      currentFichaNumber: item.fichaActual,
      requestedFichaId: '',
      requestedFichaNumber: item.fichaPropuesta,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    })));
  }, []);

  useEffect(() => { void reload().catch(() => setRequests([])); }, [reload]);

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
    /** Coordinador aprueba el traslado pendiente del CSV en el backend. */
    approve: useCallback(async (id: string) => {
      await acceptPendingTransfer(id);
      await reload();
      return { success: true };
    }, [reload]),
    /** Coordinador cancela el traslado pendiente del CSV en el backend. */
    reject: useCallback(async (id: string) => {
      await cancelPendingTransfer(id);
      await reload();
      return { success: true };
    }, [reload]),
  };
}
