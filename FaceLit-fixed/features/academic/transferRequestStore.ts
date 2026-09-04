import { addLearnerStore, getFichaById, removeLearnerStore } from './academicStore';
import { TransferRequest } from './types';

type Listener = () => void;
let requests: TransferRequest[] = [];
const listeners = new Set<Listener>();
function emit() { listeners.forEach(listener => listener()); }
export function subscribe(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function getTransferRequestsSnapshot() { return requests; }

export function createTransferRequest(learnerId: string, currentFichaId: string, requestedFichaId: string) {
  const currentFicha = getFichaById(currentFichaId);
  const requestedFicha = getFichaById(requestedFichaId);
  const learner = currentFicha?.learners.find(item => item.id === learnerId);
  if (!currentFicha || !learner || learner.status !== 'active') return { success: false, error: 'academic.learnerNotFound' };
  if (!requestedFicha || requestedFicha.status !== 'active') return { success: false, error: 'academic.fichaInactive' };
  if (currentFichaId === requestedFichaId) return { success: false, error: 'academic.sameFicha' };
  if (requests.some(request => request.learnerId === learnerId && request.status === 'pending')) return { success: false, error: 'academic.transferAlreadyPending' };
  const request: TransferRequest = { id: Date.now().toString(), learnerId, learnerFicha: currentFicha.number, currentFichaId, requestedFichaId, status: 'pending', requestedAt: new Date().toISOString() };
  requests = [...requests, request]; emit(); return { success: true, request };
}

export function approveTransferRequest(id: string, decidedBy: string, approvalConditions?: string) {
  const request = requests.find(item => item.id === id);
  if (!request) return { success: false, error: 'academic.transferNotFound' };
  const learner = getFichaById(request.currentFichaId)?.learners.find(item => item.id === request.learnerId);
  if (request.status !== 'pending' || !learner) return { success: false, error: 'academic.transferNotFound' };
  const destination = getFichaById(request.requestedFichaId);
  if (!destination || destination.status !== 'active') return { success: false, error: 'academic.fichaInactive' };
  removeLearnerStore(request.currentFichaId, learner.id);
  const addResult = addLearnerStore(request.requestedFichaId, learner);
  if (!addResult.success) return addResult;
  requests = requests.map(item => item.id === id ? { ...item, status: 'approved' as const, decidedAt: new Date().toISOString(), decidedBy, approvalConditions: approvalConditions?.trim() || undefined } : item); emit(); return { success: true };
}

export function rejectTransferRequest(id: string, decidedBy: string, reason: string) {
  const request = requests.find(item => item.id === id);
  if (!request || request.status !== 'pending') return { success: false, error: 'academic.transferNotFound' };
  requests = requests.map(item => item.id === id ? { ...item, status: 'rejected' as const, decidedAt: new Date().toISOString(), decidedBy, reason } : item); emit(); return { success: true };
}