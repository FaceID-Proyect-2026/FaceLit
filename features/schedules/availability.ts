// ─────────────────────────────────────────────
//  features/schedules/availability.ts
//  Motor de disponibilidad para Gestión de Horarios (Prompt maestro,
//  secciones 8, 9, 12, 13, 19 y 21).
//
//  Regla de oro del documento (sección 13): ELEGIBILIDAD y
//  DISPONIBILIDAD son conceptos distintos y NO deben mezclarse.
//    - Elegible  = "¿puede dictar esta formación?" (no mira horarios)
//    - Disponible = "¿está libre en este día/franja/período?"
//
//  La disponibilidad NUNCA se guarda como estado (nada de
//  `is_available = true`): se calcula en cada consulta a partir de los
//  horarios activos existentes, igual que ya hace
//  `checkScheduleConflict` en schedulesStore.ts. Este módulo reutiliza
//  esa misma regla de solapamiento en vez de duplicarla.
// ─────────────────────────────────────────────
import { getEligibleInstructorsForProgram } from '../academic/instructors/instructorsStore';
import { getInstructorFullName, Instructor } from '../academic/instructors/types';
import { getSnapshot as getEnvironmentsSnapshot } from '../environments/environmentsStore';
import { Environment } from '../environments/types';
import { getSchedulesSnapshot } from './schedulesStore';

// Misma regla de solapamiento que checkScheduleConflict (sección 9):
// newStart < existingEnd AND newEnd > existingStart.
function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export interface AvailabilityQuery {
  academicPeriodId: string;
  programId: string;
  day: string;
  startTime: string;
  endTime: string;
  excludeScheduleId?: string; // al editar un horario existente, no debe chocar consigo mismo
}

export interface InstructorAvailability {
  instructorId: string;
  name: string;
  type: Instructor['type'];
  eligible: boolean;
  available: boolean;
}

export interface EnvironmentAvailability {
  environmentId: string;
  code: string;
  available: boolean;
}

// ── Instructores: elegibles y, entre ellos, cuáles están disponibles ──
export function getInstructorsAvailability(query: AvailabilityQuery): InstructorAvailability[] {
  const eligible = getEligibleInstructorsForProgram(query.programId);
  const schedules = getSchedulesSnapshot();

  return eligible.map(instructor => {
    // Ocupado si tiene OTRO horario activo, mismo período académico y
    // mismo día, con franja que se solapa — sin importar el programa
    // (sección 11: un instructor transversal puede tener horarios en
    // varios programas, pero no al mismo tiempo).
    const busy = schedules.some(s =>
      s.id !== query.excludeScheduleId &&
      s.status === 'active' &&
      s.instructorId === instructor.id &&
      s.academicPeriodId === query.academicPeriodId &&
      s.day === query.day &&
      timesOverlap(query.startTime, query.endTime, s.startTime, s.endTime)
    );
    return {
      instructorId: instructor.id,
      name: getInstructorFullName(instructor),
      type: instructor.type,
      eligible: true,
      available: !busy,
    };
  });
}

// ── Ambientes: activos y, entre ellos, cuáles están disponibles ──
export function getEnvironmentsAvailability(query: Pick<AvailabilityQuery, 'academicPeriodId' | 'day' | 'startTime' | 'endTime' | 'excludeScheduleId'>): EnvironmentAvailability[] {
  const activeEnvironments: Environment[] = getEnvironmentsSnapshot().filter(e => e.status === 'active');
  const schedules = getSchedulesSnapshot();

  return activeEnvironments.map(environment => {
    const busy = schedules.some(s =>
      s.id !== query.excludeScheduleId &&
      s.status === 'active' &&
      s.environmentId === environment.id &&
      s.academicPeriodId === query.academicPeriodId &&
      s.day === query.day &&
      timesOverlap(query.startTime, query.endTime, s.startTime, s.endTime)
    );
    return { environmentId: environment.id, code: environment.code, available: !busy };
  });
}
