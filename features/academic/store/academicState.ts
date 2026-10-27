import { Ficha, Instructor, Learner, Program } from '../types';

export const academicState = {
  programs: [] as Program[],
  fichas: [] as Ficha[],
  instructors: [] as Instructor[],
  orphanLearners: [] as OrphanLearner[],
  loading: false,
  loadError: null as string | null,
  academicMetaSnapshot: { loading: false, loadError: null as string | null },
};

type Listener = () => void;

const listeners = new Set<Listener>();

export function emit() { listeners.forEach(l => l()); }

export const isValidDocument = (value: string) => /^\d{6,15}$/.test((value ?? '').trim());

export function hydrateAcademicStore(next: {
    programs: Program[];
    fichas: Ficha[];
    instructors: Instructor[];
}) {
    academicState.programs = next.programs;
    academicState.fichas = next.fichas;
    academicState.instructors = next.instructors;
    academicState.loading = false;
    academicState.loadError = null;
    academicState.academicMetaSnapshot = { loading: academicState.loading, loadError: academicState.loadError };
    emit();
}

export function setAcademicStoreLoading(nextLoading: boolean) {
    academicState.loading = nextLoading;
    academicState.academicMetaSnapshot = { loading: academicState.loading, loadError: academicState.loadError };
    emit();
}

export function setAcademicStoreError(error: string | null) {
    academicState.loadError = error;
    academicState.loading = false;
    academicState.academicMetaSnapshot = { loading: academicState.loading, loadError: academicState.loadError };
    emit();
}

export function clearAcademicStore() {
    academicState.programs = [];
    academicState.fichas = [];
    academicState.instructors = [];
    academicState.orphanLearners = [];
    academicState.loading = false;
    academicState.loadError = null;
    academicState.academicMetaSnapshot = { loading: academicState.loading, loadError: academicState.loadError };
    emit();
}

export function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

// ── Snapshots ────────────────────────────────
export const getProgramsSnapshot = () => academicState.programs;

export const getFichasSnapshot = () => academicState.fichas;

export const getInstructorsSnapshot = () => academicState.instructors;

export const getAcademicMetaSnapshot = () => academicState.academicMetaSnapshot;

export const getProgramById = (id: string) => academicState.programs.find(p => p.id === id);

export const getFichaById = (id: string) => academicState.fichas.find(f => f.id === id);

export const getInstructorById = (id: string) => academicState.instructors.find(i => i.id === id);

// ── RF-3.3 §10 — Generador de código de traslado ──
// 8 caracteres alfanuméricos aleatorios (letras mayúsculas + dígitos).
// No coincide con el ficha_codigo de 7 dígitos públicos.
export function generateTransferCode(): string {
    const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/I/1 para evitar confusión visual
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return code;
}

// ── Orphan pool (traslado iniciado por Coordinador) ──
export interface OrphanLearner extends Learner {
    fromFichaId?: string;
    fromFichaNumber?: string;
    movedAt: string;
}

export const getOrphanLearnersSnapshot = () => academicState.orphanLearners;
