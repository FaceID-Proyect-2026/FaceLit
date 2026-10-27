import { pushNotification } from '../../notifications/notificationsStore';
import { Ficha } from '../types';
import { emit, generateTransferCode, academicState } from './academicState';

// ── Fichas ────────────────────────────────────
export function registerFicha(number: string, programId: string) {
    const normalizedNumber = number.trim();
    const program = academicState.programs.find(p => p.id === programId);
    if (!normalizedNumber || !program || program.status !== 'active')
        return null;
    if (academicState.fichas.some(f => f.number === normalizedNumber))
        return null;
    const now = new Date().toISOString();
    const f: Ficha = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        number: normalizedNumber,
        status: 'active',
        programId,
        code: `FCH-${Date.now().toString().slice(-6)}`,
        transferCode: generateTransferCode(),
        learners: [],
        createdAt: now,
        updatedAt: now,
    };
    academicState.fichas = [...academicState.fichas, f];
    academicState.programs = academicState.programs.map(p => p.id === programId ? { ...p, fichas: [...p.fichas, f.id] } : p);
    emit();
    return f;
}

export function updateFichaStore(id: string, data: Partial<Ficha>) {
    const current = academicState.fichas.find(f => f.id === id);
    if (!current)
        return { success: false, error: 'academic.fichaNotFound' };
    const nextProgramId = data.programId ?? current.programId;
    const nextProgram = academicState.programs.find(p => p.id === nextProgramId);
    if (!nextProgram || nextProgram.status !== 'active')
        return { success: false, error: 'academic.noActivePrograms' };
    const nextNumber = data.number?.trim();
    if (nextNumber && academicState.fichas.some(f => f.id !== id && f.number === nextNumber)) {
        return { success: false, error: 'academic.duplicateFicha' };
    }
    const now = new Date().toISOString();
    academicState.fichas = academicState.fichas.map(f => f.id === id ? { ...f, ...data, number: data.number?.trim() ?? f.number, updatedAt: now } : f);
    academicState.programs = academicState.programs.map(p => {
        const without = p.fichas.filter(fid => fid !== id);
        return p.id === nextProgramId
            ? { ...p, fichas: [...without, id], updatedAt: now }
            : { ...p, fichas: without };
    });
    emit();
    return { success: true };
}

/** RF-3.3 §10 — Regenera el código de traslado de una ficha (invalida el anterior). */
export function regenerateTransferCodeStore(fichaId: string) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    if (!ficha)
        return { success: false, error: 'academic.fichaNotFound' };
    const newCode = generateTransferCode();
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId ? { ...f, transferCode: newCode, updatedAt: new Date().toISOString() } : f);
    emit();
    return { success: true, transferCode: newCode };
}

export function deactivateFichaStore(id: string) {
    const ficha = academicState.fichas.find(f => f.id === id);
    if (!ficha)
        return { success: false, error: 'academic.fichaNotFound' };
    academicState.fichas = academicState.fichas.map(f => f.id === id ? { ...f, status: 'inactive' as const, updatedAt: new Date().toISOString() } : f);
    emit();
    return { success: true };
}

export function reactivateFichaStore(id: string) {
    const ficha = academicState.fichas.find(f => f.id === id);
    if (!ficha)
        return { success: false, error: 'academic.fichaNotFound' };
    if (ficha.status !== 'inactive')
        return { success: false, error: 'academic.alreadyActive' };
    academicState.fichas = academicState.fichas.map(f => f.id === id ? { ...f, status: 'active' as const, updatedAt: new Date().toISOString() } : f);
    emit();
    return { success: true };
}

export function deleteFichaStore(id: string) {
    const ficha = academicState.fichas.find(f => f.id === id);
    if (!ficha)
        return { success: false, error: 'academic.fichaNotFound' };
    if (ficha.status !== 'inactive')
        return { success: false, error: 'academic.noDeleteActiveFicha' };
    if (ficha.learners.length > 0) {
        pushNotification('academic_delete_blocked', 'Intento de eliminación bloqueado', `No fue posible eliminar la ficha ${ficha.number} porque tiene aprendices asociados.`, { entityType: 'ficha', entityId: id });
        return { success: false, error: 'academic.fichaHasLearners' };
    }
    academicState.fichas = academicState.fichas.filter(f => f.id !== id);
    academicState.programs = academicState.programs.map(p => ({ ...p, fichas: p.fichas.filter(fid => fid !== id) }));
    emit();
    return { success: true };
}

export function unlinkFichaFromProgramStore(fichaId: string, programId: string) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    if (!ficha)
        return { success: false, error: 'academic.fichaNotFound' };
    if (ficha.learners.length > 0)
        return { success: false, error: 'academic.fichaHasLearnersUnlink' };
    academicState.programs = academicState.programs.map(p => p.id === programId ? { ...p, fichas: p.fichas.filter(fid => fid !== fichaId) } : p);
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId ? { ...f, programId: '', updatedAt: new Date().toISOString() } : f);
    emit();
    return { success: true };
}

export function linkFichaToProgramStore(fichaId: string, programId: string) {
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    const program = academicState.programs.find(p => p.id === programId);
    if (!ficha)
        return { success: false, error: 'academic.fichaNotFound' };
    if (!program)
        return { success: false, error: 'academic.programNotFound' };
    if (program.status !== 'active')
        return { success: false, error: 'academic.noActivePrograms' };
    academicState.fichas = academicState.fichas.map(f => f.id === fichaId ? { ...f, programId, updatedAt: new Date().toISOString() } : f);
    academicState.programs = academicState.programs.map(p => p.id === programId && !p.fichas.includes(fichaId)
        ? { ...p, fichas: [...p.fichas, fichaId], updatedAt: new Date().toISOString() }
        : p);
    emit();
    return { success: true };
}
