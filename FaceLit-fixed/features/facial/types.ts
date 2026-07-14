export interface FacialRecord { id: string; userId: string; userName: string; status: 'registered' | 'pending' | 'failed'; date: string; }
export const MOCK_FACIAL_RECORDS: FacialRecord[] = [
  { id: 'f1', userId: '1', userName: 'Juan Pérez', status: 'registered', date: '2026-06-01' },
  { id: 'f2', userId: '2', userName: 'Ana Martínez', status: 'pending', date: '' },
  { id: 'f3', userId: '3', userName: 'Carlos López', status: 'registered', date: '2026-06-02' },
];
