// ─────────────────────────────────────────────
//  features/attendance/useAttendanceRF6.ts
//  RF-6 V4 — Consulta y reporte de asistencias
//
//  Provee helpers para los 3 sub-módulos:
//    RF-6.1 — Tarjetas por programa + tabla de ficha
//    RF-6.2 — Consulta individual por aprendiz
//    RF-6.3 — Historial tipo bandeja agrupado por ficha
//
//  Nota: no modifica datos — solo lectura y derivación.
// ─────────────────────────────────────────────
import { useMemo, useSyncExternalStore } from 'react';
import {
  getFichasSnapshot,
  getProgramsSnapshot,
  subscribe as subscribeAcademic,
} from '@/features/academic/academicStore';
import {
  getSnapshot as getEnvironmentsSnapshot,
  subscribe as subscribeEnvironments,
} from '@/features/environments/environmentsStore';
import {
  getSchedulesSnapshot,
  subscribe as subscribeSchedules,
} from '@/features/schedules/schedulesStore';
import { resolveAttendance, type ResolvedAttendance } from './useAttendance';

// ── Tipos derivados ──────────────────────────────────────────────────────────

/** Resumen del día actual para una ficha (usado en las tarjetas de RF-6.1) */
export interface FichaDaySummary {
  fichaId: string;
  fichaNumber: string;
  programId: string;
  programName: string;
  totalLearners: number;
  absentToday: number;
  lateToday: number;
  absentPct: number; // 0-100
  latePct: number;   // 0-100
}

/** Una celda de la tabla diaria de un aprendiz (RF-6.1 detalle / RF-6.2) */
export interface DayCell {
  date: string; // YYYY-MM-DD
  status: 'punctual' | 'late' | 'absent' | null; // null = sin registro
  entryTime: string;
  delayMinutes: number;
  environmentName: string;
  instructorName: string;
  fichaNumber: string;
  programName: string;
}

/** Fila de la tabla de detalle de ficha (RF-6.1 pantalla 2) */
export interface FichaTableRow {
  learnerId: string;
  learnerName: string;
  learnerDocument: string;
  days: DayCell[];
}

/** Tarjeta del historial (RF-6.3) */
export interface HistoryCard {
  id: string;         // evento original
  date: string;
  learnerId: string;
  learnerName: string;
  learnerDocument: string;
  fichaId: string;
  fichaNumber: string;
  programName: string;
  status: ResolvedAttendance['status'];
  entryTime: string;
  delayMinutes: number;
  environmentName: string;
  instructorName: string;
}

// ── Utilidad de fecha ────────────────────────────────────────────────────────

/** Genera un array de fechas YYYY-MM-DD entre start y end, inclusive. */
export function dateRange(start: string, end: string): string[] {
  if (!start || !end || start > end) return [];
  const dates: string[] = [];
  const cur = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

/** Devuelve la fecha actual en formato YYYY-MM-DD (UTC). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Hook principal ───────────────────────────────────────────────────────────

export function useAttendanceRF6() {
  // Suscribirse a los 3 stores para que el hook se actualice cuando cambian
  useSyncExternalStore(subscribeAcademic, getFichasSnapshot);
  useSyncExternalStore(subscribeSchedules, getSchedulesSnapshot);
  useSyncExternalStore(subscribeEnvironments, getEnvironmentsSnapshot);

  const allResolved = useMemo(() => resolveAttendance(), []);

  // ── RF-6.1 — Tarjetas por programa ────────────────────────────────────────

  /**
   * Para cada ficha de un programa dado, calcula los porcentajes de
   * inasistencia y retardo del día de hoy.
   */
  const getFichaCardsForProgram = useMemo(() => (programId: string): FichaDaySummary[] => {
    const fichas = getFichasSnapshot().filter(f => f.programId === programId);
    const today = todayISO();

    return fichas.map(ficha => {
      const todayEvents = allResolved.filter(
        r => r.fichaId === ficha.id && r.date === today,
      );
      const total = ficha.learners.filter(l => l.status === 'active').length;
      const absentToday = todayEvents.filter(r => r.status === 'absent').length;
      const lateToday   = todayEvents.filter(r => r.status === 'late').length;

      return {
        fichaId: ficha.id,
        fichaNumber: ficha.number,
        programId,
        programName: getProgramsSnapshot().find(p => p.id === programId)?.name ?? '',
        totalLearners: total,
        absentToday,
        lateToday,
        absentPct: total > 0 ? Math.round((absentToday / total) * 100) : 0,
        latePct:   total > 0 ? Math.round((lateToday   / total) * 100) : 0,
      };
    });
  }, [allResolved]);

  // ── RF-6.1 pantalla 2 — Tabla de detalle de ficha ─────────────────────────

  /**
   * Construye la tabla de aprendices × días para una ficha dentro de un
   * rango de fechas. Solo incluye aprendices activos.
   */
  const getFichaTable = useMemo(() => (
    fichaId: string,
    from: string,
    to: string,
  ): FichaTableRow[] => {
    const ficha = getFichasSnapshot().find(f => f.id === fichaId);
    if (!ficha) return [];

    const dates = dateRange(from, to);
    const fichaEvents = allResolved.filter(r => r.fichaId === fichaId);

    return ficha.learners
      .filter(l => l.status === 'active')
      .map(learner => {
        const learnerEvents = fichaEvents.filter(r => r.userId === learner.id);
        const days: DayCell[] = dates.map(date => {
          const ev = learnerEvents.find(r => r.date === date);
          if (!ev) return { date, status: null, entryTime: '', delayMinutes: 0, environmentName: '', instructorName: '', fichaNumber: ficha.number, programName: '' };
          return {
            date,
            status: ev.status === 'invalidEnv' ? null : ev.status,
            entryTime: ev.entryTime,
            delayMinutes: ev.delayMinutes,
            environmentName: ev.environmentName,
            instructorName: ev.instructorName,
            fichaNumber: ev.fichaNumber,
            programName: ev.programName,
          };
        });
        return {
          learnerId: learner.id,
          learnerName: `${learner.name} ${learner.lastname}`,
          learnerDocument: learner.document,
          days,
        };
      });
  }, [allResolved]);

  // ── RF-6.2 — Tabla individual por aprendiz ────────────────────────────────

  /**
   * Busca aprendices en todas las fichas por nombre o documento.
   * Devuelve lista deduplicada de { learnerId, name, document, fichaId }.
   */
  const searchLearners = useMemo(() => (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const results: { learnerId: string; name: string; document: string; fichaId: string; fichaNumber: string }[] = [];
    const seen = new Set<string>();
    for (const ficha of getFichasSnapshot()) {
      for (const l of ficha.learners) {
        if (seen.has(l.id)) continue;
        const fullName = `${l.name} ${l.lastname}`.toLowerCase();
        if (fullName.includes(q) || l.document.includes(q)) {
          seen.add(l.id);
          results.push({ learnerId: l.id, name: `${l.name} ${l.lastname}`, document: l.document, fichaId: ficha.id, fichaNumber: ficha.number });
        }
      }
    }
    return results;
  }, []);

  /**
   * Construye la tabla de un aprendiz individual dentro de un rango de fechas.
   * Cada elemento es un DayCell (igual que RF-6.1 pero para un solo aprendiz).
   */
  const getLearnerTable = useMemo(() => (
    learnerId: string,
    from: string,
    to: string,
  ): DayCell[] => {
    const dates = dateRange(from, to);
    const learnerEvents = allResolved.filter(r => r.userId === learnerId);
    return dates.map(date => {
      const ev = learnerEvents.find(r => r.date === date);
      if (!ev) return { date, status: null, entryTime: '', delayMinutes: 0, environmentName: '', instructorName: '', fichaNumber: '', programName: '' };
      return {
        date,
        status: ev.status === 'invalidEnv' ? null : ev.status,
        entryTime: ev.entryTime,
        delayMinutes: ev.delayMinutes,
        environmentName: ev.environmentName,
        instructorName: ev.instructorName,
        fichaNumber: ev.fichaNumber,
        programName: ev.programName,
      };
    });
  }, [allResolved]);

  // ── RF-6.3 — Historial tipo bandeja ──────────────────────────────────────

  /**
   * Devuelve todos los eventos (excluyendo invalidEnv) como HistoryCard,
   * ordenados por fecha descendente. Se puede filtrar por fecha, nombre
   * o documento.
   */
  const getHistory = useMemo(() => (opts?: {
    date?: string;
    nameOrDoc?: string;
    fichaId?: string;
  }): HistoryCard[] => {
    let events = allResolved.filter(r => r.status !== 'invalidEnv');

    if (opts?.date) {
      events = events.filter(r => r.date === opts.date);
    }
    if (opts?.nameOrDoc) {
      const q = opts.nameOrDoc.trim().toLowerCase();
      events = events.filter(
        r => r.userName.toLowerCase().includes(q) || r.userDocument.includes(q),
      );
    }
    if (opts?.fichaId) {
      events = events.filter(r => r.fichaId === opts.fichaId);
    }

    // Ordenar por fecha descendente
    events = [...events].sort((a, b) => b.date.localeCompare(a.date));

    return events.map(r => ({
      id: r.id,
      date: r.date,
      learnerId: r.userId,
      learnerName: r.userName,
      learnerDocument: r.userDocument,
      fichaId: r.fichaId,
      fichaNumber: r.fichaNumber,
      programName: r.programName,
      status: r.status,
      entryTime: r.entryTime,
      delayMinutes: r.delayMinutes,
      environmentName: r.environmentName,
      instructorName: r.instructorName,
    }));
  }, [allResolved]);

  return {
    allResolved,
    getFichaCardsForProgram,
    getFichaTable,
    searchLearners,
    getLearnerTable,
    getHistory,
  };
}
