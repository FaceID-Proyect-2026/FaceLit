import { generateInitialPassword, Instructor, InstructorType } from '../types';
import { emit, isValidDocument, academicState } from './academicState';

// ── Instructores (RF-3.0 V4) ──────────────────
/** RF-3.2 — Crea un instructor. Rechaza documentos duplicados. */
export function registerInstructorStore(data: {
    name: string;
    lastname: string;
    document: string;
    email: string;
    instructorType: InstructorType;
    programId?: string;
    fichaIds?: string[];
}) {
    const doc = data.document.replace(/\D/g, '').trim();
    if (!isValidDocument(doc)) {
        return { success: false, error: 'academic.invalidDocument' };
    }
    if (academicState.instructors.some(i => i.document === doc)) {
        return { success: false, error: 'academic.duplicateDocument' };
    }
    // Un instructor específico requiere programa válido
    if (data.instructorType === 'especifico') {
        const prog = academicState.programs.find(p => p.id === data.programId);
        if (!prog || prog.status !== 'active') {
            return { success: false, error: 'academic.noActivePrograms' };
        }
    }
    const now = new Date().toISOString();
    const initialPassword = generateInitialPassword(doc);
    const inst: Instructor = {
        id: `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: data.name.trim(),
        lastname: data.lastname.trim(),
        document: doc,
        email: data.email.trim().toLowerCase(),
        instructorType: data.instructorType,
        programId: data.instructorType === 'especifico' ? data.programId : undefined,
        fichaIds: data.fichaIds ?? [],
        status: 'active',
        initialPassword,
        createdAt: now,
        updatedAt: now,
    };
    academicState.instructors = [...academicState.instructors, inst];
    // Vincular al programa si es específico
    if (inst.instructorType === 'especifico' && inst.programId) {
        academicState.programs = academicState.programs.map(p => p.id === inst.programId && !p.instructorIds.includes(inst.id)
            ? { ...p, instructorIds: [...p.instructorIds, inst.id], updatedAt: now }
            : p);
    }
    emit();
    return { success: true, instructor: inst, initialPassword };
}

/** RF-3 — Asigna un instructor como responsable de una ficha. */
export function assignInstructorToFichaStore(instructorId: string, fichaId: string) {
    const inst = academicState.instructors.find(i => i.id === instructorId);
    const ficha = academicState.fichas.find(f => f.id === fichaId);
    if (!inst)
        return { success: false, error: 'academic.instructorNotFound' };
    if (!ficha)
        return { success: false, error: 'academic.fichaNotFound' };
    if (inst.fichaIds.includes(fichaId))
        return { success: true }; // ya asignado
    academicState.instructors = academicState.instructors.map(i => i.id === instructorId
        ? { ...i, fichaIds: [...i.fichaIds, fichaId], updatedAt: new Date().toISOString() }
        : i);
    emit();
    return { success: true };
}

/** RF-3 — Desasigna un instructor de una ficha. */
export function unassignInstructorFromFichaStore(instructorId: string, fichaId: string) {
    const inst = academicState.instructors.find(i => i.id === instructorId);
    if (!inst)
        return { success: false, error: 'academic.instructorNotFound' };
    academicState.instructors = academicState.instructors.map(i => i.id === instructorId
        ? { ...i, fichaIds: i.fichaIds.filter(fid => fid !== fichaId), updatedAt: new Date().toISOString() }
        : i);
    emit();
    return { success: true };
}

/** Obtiene los instructores asignados a una ficha específica. */
export function getInstructorsByFichaId(fichaId: string): Instructor[] {
    return academicState.instructors.filter(i => i.fichaIds.includes(fichaId) && i.status === 'active');
}

export function updateInstructorStore(id: string, data: Partial<Pick<Instructor, 'name' | 'lastname' | 'email' | 'instructorType' | 'programId'>>) {
    const current = academicState.instructors.find(i => i.id === id);
    if (!current)
        return { success: false, error: 'academic.instructorNotFound' };
    const newType = data.instructorType ?? current.instructorType;
    const newProgramId = newType === 'especifico' ? (data.programId ?? current.programId) : undefined;
    if (newType === 'especifico') {
        const prog = academicState.programs.find(p => p.id === newProgramId);
        if (!prog || prog.status !== 'active')
            return { success: false, error: 'academic.noActivePrograms' };
    }
    const now = new Date().toISOString();
    // Actualizar relación de programa anterior si cambió
    if (current.programId && current.programId !== newProgramId) {
        academicState.programs = academicState.programs.map(p => p.id === current.programId
            ? { ...p, instructorIds: p.instructorIds.filter(iid => iid !== id), updatedAt: now }
            : p);
    }
    if (newProgramId && newProgramId !== current.programId) {
        academicState.programs = academicState.programs.map(p => p.id === newProgramId && !p.instructorIds.includes(id)
            ? { ...p, instructorIds: [...p.instructorIds, id], updatedAt: now }
            : p);
    }
    academicState.instructors = academicState.instructors.map(i => i.id === id
        ? {
            ...i,
            name: data.name?.trim() ?? i.name,
            lastname: data.lastname?.trim() ?? i.lastname,
            email: data.email?.trim().toLowerCase() ?? i.email,
            instructorType: newType,
            programId: newProgramId,
            updatedAt: now,
        }
        : i);
    emit();
    return { success: true };
}

export function deactivateInstructorStore(id: string) {
    const inst = academicState.instructors.find(i => i.id === id);
    if (!inst)
        return { success: false, error: 'academic.instructorNotFound' };
    academicState.instructors = academicState.instructors.map(i => i.id === id ? { ...i, status: 'inactive' as const, updatedAt: new Date().toISOString() } : i);
    emit();
    return { success: true };
}

export function reactivateInstructorStore(id: string) {
    const inst = academicState.instructors.find(i => i.id === id);
    if (!inst)
        return { success: false, error: 'academic.instructorNotFound' };
    if (inst.status !== 'inactive')
        return { success: false, error: 'academic.alreadyActive' };
    academicState.instructors = academicState.instructors.map(i => i.id === id ? { ...i, status: 'active' as const, updatedAt: new Date().toISOString() } : i);
    emit();
    return { success: true };
}
