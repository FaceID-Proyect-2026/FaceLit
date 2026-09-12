// ─────────────────────────────────────────────
//  features/attendance/attendanceUIStore.ts
//
//  Store de estado de UI del módulo de Asistencias.
//  Persiste fuera de React para sobrevivir el
//  desmontaje/montaje al cambiar de tab.
//
//  Patrón idéntico al resto del proyecto
//  (useSyncExternalStore, sin Zustand).
// ─────────────────────────────────────────────

type Listener = () => void;

// ── Estado por tab ────────────────────────────

export interface ByFichaUIState {
  selectedProgramId: string;
  selectedFichaId:   string;
  dateFrom:          string;
  dateTo:            string;
}

export interface ByUserUIState {
  query:           string;
  /** null = ninguno seleccionado */
  selectedLearner: {
    learnerId:   string;
    name:        string;
    document:    string;
    fichaNumber: string;
  } | null;
  dateFrom: string;
  dateTo:   string;
}

export interface HistoryUIState {
  nameOrDoc: string;
}

interface AttendanceUIState {
  byFicha:  ByFichaUIState;
  byUser:   ByUserUIState;
  history:  HistoryUIState;
}

// ── Estado inicial ────────────────────────────

const DEFAULT_BY_FICHA: ByFichaUIState = {
  selectedProgramId: '',
  selectedFichaId:   '',
  dateFrom:          '',
  dateTo:            '',
};

const DEFAULT_BY_USER: ByUserUIState = {
  query:           '',
  selectedLearner: null,
  dateFrom:        '',
  dateTo:          '',
};

const DEFAULT_HISTORY: HistoryUIState = {
  nameOrDoc: '',
};

let state: AttendanceUIState = {
  byFicha: { ...DEFAULT_BY_FICHA },
  byUser:  { ...DEFAULT_BY_USER },
  history: { ...DEFAULT_HISTORY },
};

const listeners = new Set<Listener>();
function emit() { listeners.forEach(l => l()); }

export function subscribeAttendanceUI(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAttendanceUISnapshot(): AttendanceUIState {
  return state;
}

// ── Mutaciones By Ficha ───────────────────────

export function setByFichaProgram(selectedProgramId: string): void {
  // Al cambiar de programa se limpia la ficha y fechas
  state = { ...state, byFicha: { selectedProgramId, selectedFichaId: '', dateFrom: '', dateTo: '' } };
  emit();
}

export function setByFichaFicha(selectedFichaId: string): void {
  // Al cambiar de ficha se limpian las fechas
  state = { ...state, byFicha: { ...state.byFicha, selectedFichaId, dateFrom: '', dateTo: '' } };
  emit();
}

export function setByFichaDateFrom(dateFrom: string): void {
  // Si la nueva fecha desde es posterior a dateTo, resetear dateTo
  const dateTo = state.byFicha.dateTo && dateFrom > state.byFicha.dateTo ? '' : state.byFicha.dateTo;
  state = { ...state, byFicha: { ...state.byFicha, dateFrom, dateTo } };
  emit();
}

export function setByFichaDateTo(dateTo: string): void {
  state = { ...state, byFicha: { ...state.byFicha, dateTo } };
  emit();
}

export function clearByFichaFicha(): void {
  state = { ...state, byFicha: { ...state.byFicha, selectedFichaId: '', dateFrom: '', dateTo: '' } };
  emit();
}

// ── Mutaciones By User ────────────────────────

export function setByUserQuery(query: string): void {
  // Al cambiar la búsqueda se limpia el aprendiz y fechas
  state = { ...state, byUser: { query, selectedLearner: null, dateFrom: '', dateTo: '' } };
  emit();
}

export function setByUserLearner(
  learner: ByUserUIState['selectedLearner'],
): void {
  state = { ...state, byUser: { ...state.byUser, selectedLearner: learner, dateFrom: '', dateTo: '' } };
  emit();
}

export function setByUserDateFrom(dateFrom: string): void {
  const dateTo = state.byUser.dateTo && dateFrom > state.byUser.dateTo ? '' : state.byUser.dateTo;
  state = { ...state, byUser: { ...state.byUser, dateFrom, dateTo } };
  emit();
}

export function setByUserDateTo(dateTo: string): void {
  state = { ...state, byUser: { ...state.byUser, dateTo } };
  emit();
}

// ── Mutaciones Historial ──────────────────────

export function setHistoryNameOrDoc(nameOrDoc: string): void {
  state = { ...state, history: { nameOrDoc } };
  emit();
}
