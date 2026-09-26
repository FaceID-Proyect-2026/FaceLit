// ─────────────────────────────────────────────
//  features/academic/transferRequestStore.ts
//  RF-3.3 V4 — Solicitudes de traslado de ficha
//
//  Flujo:
//  1. Aprendiz ingresa el transferCode de la ficha destino
//     (código de 8 chars que le entregó el Coordinador)
//  2. El sistema crea una solicitud con status 'pending'
//  3. El Coordinador aprueba o rechaza desde su pantalla
//  4. Al aprobar: el aprendiz pasa a la ficha destino y se
//     desactiva automáticamente la relación con la ficha anterior
// ─────────────────────────────────────────────
import { addLearnerStore, getFichaById, getFichasSnapshot, removeLearnerStore } from './academicStore';
import { TransferRequest } from './types';

type Listener = () => void;

let requests: TransferRequest[] = [];
const listeners = new Set<Listener>();

function emit() { listeners.forEach(l => l()); }

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTransferRequestsSnapshot(): TransferRequest[] {
  return requests;
}

export function getPendingTransferRequestsSnapshot(): TransferRequest[] {
  return requests.filter(r => r.status === 'pending');
}

// ── Crear solicitud ───────────────────────────
// El aprendiz ingresa el transferCode de la ficha destino.
// La ficha se busca por transferCode, no por id.
export function createTransferRequest(
  learnerId: string,
  currentFichaId: string,
  transferCode: string,
): { success: boolean; error?: string; request?: TransferRequest } {
  const currentFicha = getFichaById(currentFichaId);
  if (!currentFicha) return { success: false, error: 'academic.fichaNotFound' };

  const learner = currentFicha.learners.find(l => l.id === learnerId);
  if (!learner || learner.status !== 'active') return { success: false, error: 'academic.learnerNotFound' };

  // Buscar la ficha destino por transferCode (case-insensitive)
  const allFichas = getFichasSnapshot();
  const requestedFicha = allFichas.find(
    f => f.transferCode.toLowerCase() === transferCode.trim().toLowerCase(),
  );

  if (!requestedFicha) return { success: false, error: 'academic.transferCodeNotFound' };
  if (requestedFicha.status !== 'active') return { success: false, error: 'academic.fichaInactive' };
  if (requestedFicha.id === currentFichaId) return { success: false, error: 'academic.sameFicha' };

  // Solo una solicitud pendiente por aprendiz a la vez
  const alreadyPending = requests.some(
    r => r.learnerId === learnerId && r.status === 'pending',
  );
  if (alreadyPending) return { success: false, error: 'academic.transferAlreadyPending' };

  const request: TransferRequest = {
    id: Date.now().toString(),
    learnerId,
    learnerName: `${learner.name} ${learner.lastname}`,
    learnerDocument: learner.document,
    learnerFicha: currentFicha.number,
    currentFichaId,
    currentFichaNumber: currentFicha.number,
    requestedFichaId: requestedFicha.id,
    requestedFichaNumber: requestedFicha.number,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  requests = [...requests, request];
  emit();
  return { success: true, request };
}

// ── Aprobar solicitud ─────────────────────────
// Mueve al aprendiz de la ficha actual a la ficha destino.
// La relación con la ficha anterior queda inactiva automáticamente.
export function approveTransferRequest(
  id: string,
  decidedBy: string,
): { success: boolean; error?: string } {
  const request = requests.find(r => r.id === id);
  if (!request) return { success: false, error: 'academic.transferNotFound' };
  if (request.status !== 'pending') return { success: false, error: 'academic.transferAlreadyDecided' };

  const currentFicha = getFichaById(request.currentFichaId);
  const learner = currentFicha?.learners.find(l => l.id === request.learnerId);
  if (!learner) return { success: false, error: 'academic.learnerNotFound' };

  const destinationFicha = getFichaById(request.requestedFichaId);
  if (!destinationFicha || destinationFicha.status !== 'active') {
    return { success: false, error: 'academic.fichaInactive' };
  }

  // 1. Remover de la ficha actual (desactiva la relación)
  removeLearnerStore(request.currentFichaId, learner.id);

  // 2. Agregar a la ficha destino (activa la nueva relación)
  const addResult = addLearnerStore(request.requestedFichaId, { ...learner, status: 'active' });
  if (!addResult.success) return addResult;

  // 3. Marcar solicitud como aprobada
  requests = requests.map(r =>
    r.id === id
      ? { ...r, status: 'approved' as const, decidedAt: new Date().toISOString(), decidedBy }
      : r,
  );
  emit();
  return { success: true };
}

// ── Rechazar solicitud ────────────────────────
// El aprendiz permanece en su ficha actual sin cambios.
export function rejectTransferRequest(
  id: string,
  decidedBy: string,
  reason: string,
): { success: boolean; error?: string } {
  const request = requests.find(r => r.id === id);
  if (!request) return { success: false, error: 'academic.transferNotFound' };
  if (request.status !== 'pending') return { success: false, error: 'academic.transferAlreadyDecided' };

  requests = requests.map(r =>
    r.id === id
      ? { ...r, status: 'rejected' as const, decidedAt: new Date().toISOString(), decidedBy, reason }
      : r,
  );
  emit();
  return { success: true };
}
