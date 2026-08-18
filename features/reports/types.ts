export interface ReportFilter { userId?: string; fichaNumber?: string; dateFrom?: string; dateTo?: string; status?: string; }
export const MOCK_REPORT_USERS = [
  { id: 'l1', name: 'Juan Pérez', ficha: '3145555' }, { id: 'l2', name: 'Ana Martínez', ficha: '3145555' },
  { id: 'l3', name: 'Carlos López', ficha: '3145555' }, { id: 'l4', name: 'María Gómez', ficha: '3145556' },
];
export const MOCK_REPORT_FICHAS = ['3145555', '3145556', '3145557', '3145558'];
