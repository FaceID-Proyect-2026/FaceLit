// ─────────────────────────────────────────────
//  features/academic/areas/types.ts
//  Área de formación. Es el concepto que conecta un Programa con
//  los Instructores específicos elegibles para dictarlo (Prompt
//  maestro, secciones 5 y 9): instructor.area == programa.area.
// ─────────────────────────────────────────────

export type AreaStatus = 'active' | 'inactive';

export interface Area {
  id: string;
  name: string;
  status: AreaStatus;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_AREAS: Area[] = [
  { id: 'a1', name: 'Desarrollo de Software', status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 'a2', name: 'Gestión Administrativa', status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 'a3', name: 'Mantenimiento de Equipos', status: 'active', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
];
