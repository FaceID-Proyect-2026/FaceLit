import { pushNotification } from '../../notifications/notificationsStore';
import { Program } from '../types';
import { emit, academicState } from './academicState';

// ── Programas ─────────────────────────────────
/** RF-3.2 — Crea un programa. Rechaza nombres duplicados (case-insensitive). */
export function registerProgram(name: string, code?: string) {
    const normalizedName = name.trim();
    if (!normalizedName)
        return null;
    if (academicState.programs.some(p => p.name.toLowerCase() === normalizedName.toLowerCase()))
        return null;
    const now = new Date().toISOString();
    const p: Program = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: normalizedName,
        status: 'active',
        fichas: [],
        instructorIds: [],
        createdAt: now,
        updatedAt: now,
    };
    academicState.programs = [...academicState.programs, p];
    emit();
    return p;
}

export function updateProgramStore(id: string, name: string, status: 'active' | 'inactive') {
    academicState.programs = academicState.programs.map(p => p.id === id ? { ...p, name: name.trim(), status, updatedAt: new Date().toISOString() } : p);
    emit();
}

export function deactivateProgramStore(id: string) {
    const prog = academicState.programs.find(p => p.id === id);
    if (!prog)
        return { success: false, error: 'academic.programNotFound' };
    if (prog.instructorIds.length > 0 || prog.fichas.length > 0) {
        return { success: false, error: 'academic.programHasRelations' };
    }
    academicState.programs = academicState.programs.map(p => p.id === id ? { ...p, status: 'inactive' as const, updatedAt: new Date().toISOString() } : p);
    emit();
    return { success: true };
}

export function reactivateProgramStore(id: string) {
    const prog = academicState.programs.find(p => p.id === id);
    if (!prog)
        return { success: false, error: 'academic.programNotFound' };
    if (prog.status !== 'inactive')
        return { success: false, error: 'academic.alreadyActive' };
    academicState.programs = academicState.programs.map(p => p.id === id ? { ...p, status: 'active' as const, updatedAt: new Date().toISOString() } : p);
    emit();
    return { success: true };
}

export function deleteProgramStore(id: string) {
    const prog = academicState.programs.find(p => p.id === id);
    if (!prog)
        return { success: false, error: 'academic.programNotFound' };
    if (prog.status !== 'inactive')
        return { success: false, error: 'academic.noDeleteActiveProgram' };
    if (prog.fichas.length > 0 || prog.instructorIds.length > 0) {
        pushNotification('academic_delete_blocked', 'Intento de eliminación bloqueado', `No fue posible eliminar el programa "${prog.name}" porque todavía tiene relaciones activas con fichas o instructores.`, { entityType: 'program', entityId: id });
        return { success: false, error: 'academic.programHasRelations' };
    }
    academicState.programs = academicState.programs.filter(p => p.id !== id);
    emit();
    return { success: true };
}
