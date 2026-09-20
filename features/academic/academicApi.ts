import { api } from '@/shared/services/api';
import type { Ficha, Instructor, Learner, Program } from './types';

// ─── Tipos de respuesta del backend ──────────
type BackendProgram = {
  idProgram: string;
  programName: string;
  programCode: string;
  state: 'ACTIVE' | 'INACTIVE';
  deactivationReason?: string | null;
};

type BackendChip = {
  idChip: string;
  idProgram: string;
  chipCode: string;
  state: 'ACTIVE' | 'INACTIVE';
  deactivationReason?: string | null;
};

// ─── InstructorResponseDTO del backend ───────
// El backend devuelve: idInstructor, idUser, firstName, lastName,
// document, email, instructorType, programIds, programNames
type BackendInstructor = {
  idInstructor: string;
  idUser: string;
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  instructorType: 'ESPECIFICO' | 'TRANSVERSAL';
  programIds: string[];
  programNames?: string[];
};

// ─── UserChipResponseDTO del backend ─────────
// El backend devuelve: idUserChip, idUser, idChip, chipCode,
// firstName, lastName, document, email, state, assignmentDate
type BackendUserChip = {
  idUserChip: string;
  idUser: string;
  idChip: string;
  chipCode?: string;
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  state: 'ACTIVE' | 'INACTIVE';
  assignmentDate: string;
};

const toProgram = (program: BackendProgram): Program => ({
  id: program.idProgram,
  name: program.programName,
  code: program.programCode,
  status: program.state.toLowerCase() as Program['status'],
  fichas: [],
  instructorIds: [],
  createdAt: '',
  updatedAt: '',
});

const toFicha = (chip: BackendChip, learners: Learner[] = []): Ficha => ({
  id: chip.idChip,
  number: chip.chipCode,
  jornada: 'morning',
  status: chip.state.toLowerCase() as Ficha['status'],
  programId: chip.idProgram,
  code: chip.chipCode,
  transferCode: '',
  learners,
  createdAt: '',
  updatedAt: '',
});

export async function fetchAcademicSnapshot() {
  const { data: rawPrograms } = await api.get<BackendProgram[]>('/api/academic/programs');
  const programs = rawPrograms.map(toProgram);
  const fichas: Ficha[] = [];

  for (const program of rawPrograms) {
    const { data: rawChips } = await api.get<BackendChip[]>(
      `/api/academic/programs/${program.idProgram}/chips`,
    );
    for (const chip of rawChips) {
      const { data: rawLearners } = await api.get<BackendUserChip[]>(
        `/api/academic/chips/${chip.idChip}/apprentices`,
      );
      // UserChipResponseDTO ya incluye firstName, lastName, document, email
      const learners = rawLearners.map<Learner>(l => ({
        id:               l.idUser,
        name:             l.firstName  ?? '',
        lastname:         l.lastName   ?? '',
        document:         l.document   ?? '',
        email:            l.email      ?? '',
        role:             'aprendiz',
        status:           l.state === 'ACTIVE' ? 'active' : 'inactive',
        validationStatus: 'validated',
        initialPassword:  null,
        createdAt:        l.assignmentDate,
        updatedAt:        l.assignmentDate,
        documentChangeLog: [],
      }));
      fichas.push(toFicha(chip, learners));
    }
  }

  // InstructorResponseDTO ya incluye firstName, lastName, document, email
  const { data: rawInstructors } = await api.get<BackendInstructor[]>('/api/academic/instructors');
  const instructors: Instructor[] = rawInstructors.map(i => ({
    id:             i.idInstructor,
    name:           i.firstName    ?? '',
    lastname:       i.lastName     ?? '',
    document:       i.document     ?? '',
    email:          i.email        ?? '',
    instructorType: i.instructorType === 'ESPECIFICO' ? 'especifico' : 'transversal',
    programId:      i.programIds?.[0],
    fichaIds:       [],
    status:         'active',
    initialPassword: null,
    createdAt:      '',
    updatedAt:      '',
  }));

  return { programs, fichas, instructors };
}

export async function createProgram(programName: string, programCode: string) {
  const { data } = await api.post<BackendProgram>('/api/academic/programs', { programName, programCode });
  return toProgram(data);
}

export async function updateProgram(id: string, programName: string, programCode: string) {
  const { data } = await api.put<BackendProgram>(`/api/academic/programs/${id}`, { programName, programCode });
  return toProgram(data);
}

export async function searchProgramsByName(name: string) {
  const { data } = await api.get<BackendProgram[]>('/api/academic/programs/search', { params: { name } });
  return data.map(toProgram);
}

export async function findProgramByCode(code: string) {
  const { data } = await api.get<BackendProgram>(`/api/academic/programs/code/${encodeURIComponent(code)}`);
  return toProgram(data);
}

export async function createFicha(idProgram: string, chipCode: string) {
  const { data } = await api.post<BackendChip>(`/api/academic/programs/${idProgram}/chips`, { idProgram, chipCode });
  return toFicha(data);
}

export async function updateFicha(id: string, idProgram: string, chipCode: string) {
  const { data } = await api.put<BackendChip>(`/api/academic/chips/${id}`, { idProgram, chipCode });
  return toFicha(data);
}

export async function searchFichasByCode(code: string) {
  const { data } = await api.get<BackendChip[]>('/api/academic/chips/search', { params: { code } });
  return data.map(chip => toFicha(chip));
}

export async function fetchChangeHistory(entityName: string, entityId: string) {
  const { data } = await api.get('/api/academic/change-history', { params: { entityName, entityId } });
  return data;
}

export async function setProgramLifecycle(id: string, action: 'reactivate' | 'delete') {
  const path = action === 'reactivate'
    ? `/api/academic/programs/${id}/reactivate`
    : `/api/academic/programs/${id}`;
  const { data } = action === 'reactivate'
    ? await api.patch<BackendProgram>(path)
    : await api.delete<BackendProgram>(path);
  return toProgram(data);
}

export async function setFichaLifecycle(id: string, action: 'reactivate' | 'delete') {
  const path = action === 'reactivate'
    ? `/api/academic/chips/${id}/reactivate`
    : `/api/academic/chips/${id}`;
  const { data } = action === 'reactivate'
    ? await api.patch<BackendChip>(path)
    : await api.delete<BackendChip>(path);
  return toFicha(data);
}

export async function uploadAcademicCsv(file: { uri: string; name: string } | Blob) {
  const form = new FormData();
  const fileName = file instanceof Blob ? 'carga-academica.csv' : file.name;
  const filePayload = file instanceof Blob
    ? file
    : ({ uri: file.uri, name: file.name, type: 'text/csv' } as any);

  // El backend no siempre usa el mismo nombre de campo en multipart.
  // Enviamos varias claves compatibles para evitar 500 por campo perdido.
  const fieldNames = ['file', 'archivo', 'csvFile', 'csv'];
  for (const fieldName of fieldNames) {
    if (file instanceof Blob) {
      form.append(fieldName, filePayload as Blob, fileName);
    } else {
      form.append(fieldName, filePayload as any);
    }
  }

  // ⚠️ NO pasar Content-Type manualmente — axios lo genera con el boundary
  //    correcto cuando detecta FormData. Sobreescribirlo rompe el multipart.
  // La carga de CSV puede demorar más de 15s porque el backend valida filas,
  // referencias y actualizaciones masivas.
  const { data } = await api.post('/api/academic/csv/upload', form, {
    timeout: 180000,
    headers: { Accept: 'application/json' },
  });
  return data;
}

export async function downloadAcademicTemplate() {
  const { data } = await api.get('/api/academic/csv/template', { responseType: 'blob' });
  return data;
}

export async function fetchInstructors(params: {
  document?: string;
  name?: string;
  type?: string;
} = {}) {
  const { data } = await api.get<BackendInstructor[]>('/api/academic/instructors/search', { params });
  return data;
}

// ─── Crear instructor — datos personales ────────────────────────────────────
// El backend crea el usuario si no existe, o reutiliza si ya existe.
// InstructorRequestDTO acepta: document, name, lastname, email, instructorType, programIds
export async function createInstructor(payload: {
  document: string;
  name: string;
  lastname: string;
  email: string;
  instructorType: 'ESPECIFICO' | 'TRANSVERSAL';
  programIds: string[];
}) {
  const { data } = await api.post<BackendInstructor>('/api/academic/instructors', payload);
  return data;
}

export async function updateInstructor(id: string, payload: {
  instructorType: 'ESPECIFICO' | 'TRANSVERSAL';
  programIds: string[];
}) {
  const { data } = await api.put<BackendInstructor>(`/api/academic/instructors/${id}`, payload);
  return data;
}

export async function deleteInstructor(id: string) {
  return api.delete(`/api/academic/instructors/${id}`);
}

export async function fetchEligibleInstructors(idProgram: string) {
  const { data } = await api.get<BackendInstructor[]>('/api/academic/instructors/eligible', {
    params: { idProgram },
  });
  return data;
}

export type BackendPendingTransfer = {
  idPendingTransfer: string;
  idUser: string;
  fila: number;
  aprendiz: string;
  fichaActual: string;
  fichaPropuesta: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED';
};

export async function fetchPendingTransfers() {
  const { data } = await api.get<BackendPendingTransfer[]>('/api/academic/csv/pending-transfers');
  return data;
}

export async function acceptPendingTransfer(id: string) {
  return api.post(`/api/academic/csv/pending-transfers/${id}/accept`);
}

export async function cancelPendingTransfer(id: string) {
  return api.post(`/api/academic/csv/pending-transfers/${id}/cancel`);
}

// ─── Asignar aprendiz a ficha — datos personales ────────────────────────────
// El backend crea el usuario si no existe, o reutiliza si ya existe.
// UserChipRequestDTO acepta: document, name, lastname, email
export async function assignApprentice(idChip: string, payload: {
  document: string;
  name: string;
  lastname: string;
  email: string;
}) {
  return api.post<BackendUserChip>(`/api/academic/chips/${idChip}/apprentices`, payload);
}

export async function fetchActiveChip(idUser: string) {
  const { data } = await api.get(`/api/academic/users/${idUser}/chip`);
  return data;
}

export async function transferApprentice(idUser: string, idNewChip: string) {
  return api.post(`/api/academic/users/${idUser}/chip/transfer`, { idNewChip });
}
