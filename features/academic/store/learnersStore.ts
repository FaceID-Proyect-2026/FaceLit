import { pushNotification } from '../../notifications/notificationsStore';
import { DocumentChangeLogEntry, generateInitialPassword, Learner, ValidationStatus } from '../types';
import { emit, isValidDocument, academicState } from './academicState';

// ── Aprendices ────────────────────────────────
export function addLearnerStore(fichaId: string, learner: Learner) {
    const target = academicState.fichas.find(f => f.id === fichaId);
    if (!target)
        return { success: false, error: 'academic.fichaNotFound' };
    if (target.status !== 'active')
        return { success: false, error: 'academic.fichaInactive' };
    if (target.learners.some(e => e.id === learner.id))
        return { success: true };
    const alreadyAssigned = academicState.fichas.some(f => f.id !== fichaId && f.learners.some(e => e.id === learner.id && e.status === 'active'));
    if (alreadyAssigned)
        return { success: false, error: 'academic.learnerAlreadyAssigned' };
    const now = new Date().toISOString();
    // Genera contraseña inicial si no viene con una
    const initialPassword = learner.initialPassword ?? generateInitialPassword(learner.document);
    const normalized = {
        ...learner,
        initialPassword,
        createdAt: learner.createdAt ?? now,
        updatedAt: now,
        documentChangeLog: learner.documentChangeLog ?? [],
    };
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId ? { ...f, learners: [...f.learners, normalized], updatedAt: now } : f);
    emit();
    return { success: true, initialPassword };
}

/**
 * RF-3.2 — Los aprendices NUNCA se eliminan físicamente.
 * Solo pasan de activo → inactivo. Su historial se conserva.
 */
export function deactivateLearnerStore(fichaId: string, learnerId: string) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    const learner = ficha?.learners.find(l => l.id === learnerId);
    if (!ficha || !learner)
        return { success: false, error: 'academic.learnerNotFound' };
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId
        ? {
            ...f,
            learners: f.learners.map(l => l.id === learnerId
                ? { ...l, status: 'inactive' as const, updatedAt: new Date().toISOString() }
                : l),
            updatedAt: new Date().toISOString(),
        }
        : f);
    emit();
    return { success: true };
}

/** Reactiva un aprendiz que estaba inactivo en la misma ficha. */
export function reactivateLearnerStore(fichaId: string, learnerId: string) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    const learner = ficha?.learners.find(l => l.id === learnerId);
    if (!ficha || !learner)
        return { success: false, error: 'academic.learnerNotFound' };
    if (learner.status === 'active')
        return { success: false, error: 'academic.alreadyActive' };
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId
        ? {
            ...f,
            learners: f.learners.map(l => l.id === learnerId
                ? { ...l, status: 'active' as const, updatedAt: new Date().toISOString() }
                : l),
            updatedAt: new Date().toISOString(),
        }
        : f);
    emit();
    return { success: true };
}

/** Elimina físicamente al aprendiz de la ficha (solo para uso interno del pool orphan) */
export function removeLearnerStore(fichaId: string, learnerId: string) {
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId
        ? { ...f, learners: f.learners.filter(l => l.id !== learnerId), updatedAt: new Date().toISOString() }
        : f);
    emit();
}

export function markLearnerValidation(learnerId: string, status: ValidationStatus) {
    const now = new Date().toISOString();
    academicState.fichas = academicState.fichas.map(f => ({
        ...f,
        learners: f.learners.map(l => l.id === learnerId ? { ...l, validationStatus: status, updatedAt: now } : l),
    }));
    emit();
}

export function updateLearnerInfoStore(fichaId: string, learnerId: string, data: {
    name?: string;
    lastname?: string;
    email?: string;
    document?: string;
    updatedAt?: string;
}) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    const learner = ficha?.learners.find(l => l.id === learnerId);
    if (!ficha || !learner)
        return { success: false, error: 'academic.learnerNotFound' };
    const nextDoc = data.document?.replace(/\D/g, '').trim();
    if (nextDoc && nextDoc !== learner.document) {
        if (!isValidDocument(nextDoc))
            return { success: false, error: 'academic.invalidDocument' };
        if (academicState.fichas.some(f => f.learners.some(l => l.id !== learnerId && l.document === nextDoc))) {
            return { success: false, error: 'academic.duplicateDocument' };
        }
    }
    const nextEmail = data.email?.trim().toLowerCase();
    if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        return { success: false, error: 'academic.invalidEmail' };
    }
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId
        ? {
            ...f,
            learners: f.learners.map(l => l.id === learnerId
                ? {
                    ...l,
                    name: data.name?.trim() ?? l.name,
                    lastname: data.lastname?.trim() ?? l.lastname,
                    email: nextEmail ?? l.email,
                    document: nextDoc ?? l.document,
                    updatedAt: data.updatedAt ?? l.updatedAt,
                }
                : l),
        }
        : f);
    emit();
    return { success: true };
}

export function updateLearnerDocument(fichaId: string, learnerId: string, document: string, changedBy?: string, reason?: string) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    const learner = ficha?.learners.find(l => l.id === learnerId);
    if (!ficha || !learner)
        return { success: false, error: 'academic.learnerNotFound' };
    const next = document.replace(/\D/g, '').trim();
    if (!next || !isValidDocument(next))
        return { success: false, error: 'academic.invalidDocument' };
    if (academicState.fichas.some(f => f.learners.some(l => l.id !== learnerId && l.document === next))) {
        return { success: false, error: 'academic.duplicateDocument' };
    }
    if (learner.document === next)
        return { success: true };
    const entry: DocumentChangeLogEntry = {
        id: Date.now().toString(), learnerId,
        oldDocument: learner.document, previousDocument: learner.document, newDocument: next,
        changedAt: new Date().toISOString(), changedBy, reason,
    };
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId
        ? {
            ...f,
            learners: f.learners.map(l => l.id === learnerId
                ? { ...l, document: next, updatedAt: entry.changedAt, documentChangeLog: [...(l.documentChangeLog ?? []), entry] }
                : l),
            updatedAt: entry.changedAt,
        }
        : f);
    emit();
    return { success: true };
}

export function correctInstitutionalLearnerStore(fichaId: string, learnerId: string, document: string, reason: string, changedBy?: string) {
    if (!reason.trim())
        return { success: false, error: 'academic.correctionReasonRequired' };
    const result = updateLearnerDocument(fichaId, learnerId, document, changedBy, reason);
    if (!result.success)
        return result;
    markLearnerValidation(learnerId, 'validated');
    return { success: true };
}

export function moveLearnerToOrphanPoolStore(fichaId: string, learnerId: string) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    const learner = ficha?.learners.find(l => l.id === learnerId);
    if (!ficha || !learner)
        return { success: false, error: 'academic.learnerNotFound' };
    const now = new Date().toISOString();
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId
        ? { ...f, learners: f.learners.filter(l => l.id !== learnerId), updatedAt: now }
        : f);
    academicState.orphanLearners = [...academicState.orphanLearners, { ...learner, fromFichaId: ficha.id, fromFichaNumber: ficha.number, movedAt: now }];
    emit();
    return { success: true };
}

/**
 * RF-3.3 — El aprendiz ingresa el transferCode (8 chars alfanum) que le
 * entregó el Coordinador. Si es válido, se le asigna esa ficha y se
 * desactiva automáticamente su relación con la ficha anterior.
 *
 * Este código se usa desde dos flujos:
 * 1. Aprendiz en pool orphan (ya no tiene ficha activa).
 * 2. Aprendiz con ficha activa que quiere trasladarse directamente
 *    (el Coordinador le generó el transferCode de la ficha destino).
 */
export function joinFichaByTransferCodeStore(learnerId: string, transferCode: string) {
    const normalizedCode = transferCode.trim().toUpperCase();
    // Validar formato: 8 chars alfanuméricos
    if (!/^[A-Z0-9]{8}$/.test(normalizedCode)) {
        return { success: false, error: 'academic.transferCodeInvalid' };
    }
    // Buscar ficha destino por transferCode
    const target = academicState.fichas.find(f => f.transferCode === normalizedCode);
    if (!target)
        return { success: false, error: 'academic.transferCodeNotFound' };
    if (target.status !== 'active')
        return { success: false, error: 'academic.fichaInactive' };
    // Caso 1: aprendiz en orphan pool
    const orphan = academicState.orphanLearners.find(l => l.id === learnerId);
    if (orphan) {
        // Verificar que no está ya en la ficha destino
        if (target.learners.some(l => l.id === learnerId)) {
            return { success: false, error: 'academic.joinAlreadyInFicha' };
        }
        const { fromFichaId, fromFichaNumber, movedAt, ...plain } = orphan;
        const result = addLearnerStore(target.id, plain);
        if (!result.success)
            return result;
        academicState.orphanLearners = academicState.orphanLearners.filter(l => l.id !== learnerId);
        emit();
        return { success: true, fichaNumber: target.number };
    }
    // Caso 2: aprendiz activo en una ficha — traslado directo RF-3.3
    const currentFicha = academicState.fichas.find(f => f.learners.some(l => l.id === learnerId && l.status === 'active'));
    if (!currentFicha)
        return { success: false, error: 'academic.learnerNotFound' };
    // Ya está en la ficha destino
    if (currentFicha.id === target.id) {
        return { success: false, error: 'academic.joinAlreadyInFicha' };
    }
    const learner = currentFicha.learners.find(l => l.id === learnerId)!;
    const now = new Date().toISOString();
    // Desactivar en ficha actual (RF-3.3: la ficha anterior queda inactiva)
    academicState.fichas = academicState.fichas.map(f => f.id === currentFicha.id
        ? {
            ...f,
            learners: f.learners.map(l => l.id === learnerId ? { ...l, status: 'inactive' as const, updatedAt: now } : l),
            updatedAt: now,
        }
        : f);
    // Agregar en ficha destino
    const result = addLearnerStore(target.id, { ...learner, status: 'active' as const });
    if (!result.success) {
        // Revertir si falla
        academicState.fichas = academicState.fichas.map(f => f.id === currentFicha.id
            ? {
                ...f,
                learners: f.learners.map(l => l.id === learnerId ? { ...l, status: 'active' as const } : l),
            }
            : f);
        return result;
    }
    emit();
    // RF-8 — Notificación #6: traslado completado por código
    pushNotification('learner_transferred', 'Traslado completado por código', `${learner.name} ${learner.lastname} (${learner.document}) ingresó el código de traslado y ya está activo en la ficha ${target.number}. La ficha anterior (${currentFicha.number}) quedó inactiva para él.`, {
        learnerName: `${learner.name} ${learner.lastname}`,
        learnerDocument: learner.document,
        fromFichaNumber: currentFicha.number,
        toFichaNumber: target.number,
    });
    return { success: true, fichaNumber: target.number, prevFichaNumber: currentFicha.number };
}

export function joinFichaByCodeStore(learnerId: string, code: string) {
    const learner = academicState.orphanLearners.find(l => l.id === learnerId);
    if (!learner)
        return { success: false, error: 'academic.learnerNotFound' };
    const normalizedCode = code.trim().toUpperCase();
    // Primero intenta por transferCode (RF-3 V4)
    const byTransfer = academicState.fichas.find(f => f.transferCode === normalizedCode);
    if (byTransfer)
        return joinFichaByTransferCodeStore(learnerId, normalizedCode);
    // Fallback: búsqueda por code interno o número (compatibilidad)
    const target = academicState.fichas.find(f => f.code.toLowerCase() === code.trim().toLowerCase() || f.number === code.trim());
    if (!target)
        return { success: false, error: 'academic.fichaCodeNotFound' };
    if (target.status !== 'active')
        return { success: false, error: 'academic.fichaInactive' };
    const { fromFichaId, fromFichaNumber, movedAt, ...plain } = learner;
    const result = addLearnerStore(target.id, plain);
    if (!result.success)
        return result;
    academicState.orphanLearners = academicState.orphanLearners.filter(l => l.id !== learnerId);
    emit();
    return { success: true, fichaNumber: target.number };
}

export function deleteOrphanLearnerStore(learnerId: string) {
    if (!academicState.orphanLearners.some(l => l.id === learnerId))
        return { success: false, error: 'academic.learnerNotFound' };
    academicState.orphanLearners = academicState.orphanLearners.filter(l => l.id !== learnerId);
    emit();
    return { success: true };
}
