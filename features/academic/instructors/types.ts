// ─────────────────────────────────────────────
//  features/academic/instructors/types.ts
//  Catálogo e clasificación de Instructores (Prompt maestro, sección 3).
//
//  Un instructor ESPECIFICO pertenece a un Área y solo es elegible para
//  programas de esa misma área. Un instructor TRANSVERSAL puede dictar
//  una o más Transversales y, por lo tanto, trabajar con cualquier
//  programa donde esas transversales existan — sin duplicarlo por
//  programa (sección 4/11).
//
//  Nota: en el modelo de datos (FaceLit-DB) "instructor" ya es un ROL
//  sobre `security.user_app` (roleandpermission.role). Este catálogo no
//  crea un nuevo tipo de usuario: guarda la CLASIFICACIÓN académica de
//  quienes ya tienen ese rol, para poder calcular elegibilidad.
// ─────────────────────────────────────────────

export type InstructorType = 'ESPECIFICO' | 'TRANSVERSAL';
export type InstructorStatus = 'active' | 'inactive';

export interface Instructor {
  id: string;
  name: string;
  lastname: string;
  document: string;
  email?: string;
  type: InstructorType;
  areaId?: string;          // Requerido si type === 'ESPECIFICO'
  transversalIds: string[]; // Requerido (>=1) si type === 'TRANSVERSAL'
  status: InstructorStatus;
  createdAt: string;
  updatedAt: string;
}

export function getInstructorFullName(instructor: Pick<Instructor, 'name' | 'lastname'>): string {
  return `${instructor.name} ${instructor.lastname}`.trim();
}

export const MOCK_INSTRUCTORS_PROFILES: Instructor[] = [
  { id: 'i1', name: 'María', lastname: 'González', document: '10203040', type: 'ESPECIFICO', areaId: 'a1', transversalIds: [], status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 'i2', name: 'Pedro', lastname: 'Ramírez', document: '10203041', type: 'ESPECIFICO', areaId: 'a2', transversalIds: [], status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 'i3', name: 'Laura', lastname: 'Torres', document: '10203042', type: 'TRANSVERSAL', transversalIds: ['t1'], status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 'i4', name: 'Diego', lastname: 'Herrera', document: '10203043', type: 'ESPECIFICO', areaId: 'a1', transversalIds: [], status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 'i5', name: 'Carlos', lastname: 'Gómez', document: '10203044', type: 'TRANSVERSAL', transversalIds: ['t1', 't2'], status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
];
