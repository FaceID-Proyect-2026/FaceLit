// ─────────────────────────────────────────────
//  features/academic/transversals/types.ts
//  Una Transversal es independiente del Programa (Prompt maestro,
//  sección 4): la misma transversal (ej. "Inglés") puede existir en
//  varios programas de formación al mismo tiempo. La relación se
//  modela como N:N mediante `programIds`, en vez de duplicar la
//  transversal por cada programa.
// ─────────────────────────────────────────────

export type TransversalStatus = 'active' | 'inactive';

export interface Transversal {
  id: string;
  name: string;
  status: TransversalStatus;
  programIds: string[]; // Programas de Formación donde se dicta esta transversal
  createdAt: string;
  updatedAt: string;
}

export const MOCK_TRANSVERSALS: Transversal[] = [
  { id: 't1', name: 'Inglés', status: 'active', programIds: ['1', '2', '4'], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 't2', name: 'Ética', status: 'active', programIds: ['1', '2'], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
  { id: 't3', name: 'Comunicación', status: 'active', programIds: ['1'], createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
];
