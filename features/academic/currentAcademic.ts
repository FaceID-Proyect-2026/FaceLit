import type { Ficha, Instructor, Learner, Program } from './types';

type CurrentUserLike = {
  id?: string;
  document?: string;
  email?: string;
} | null | undefined;

function sameText(a?: string, b?: string) {
  return Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
}

export function findCurrentLearner(fichas: Ficha[], user: CurrentUserLike): {
  ficha: Ficha;
  learner: Learner;
} | null {
  if (!user) return null;
  for (const ficha of fichas) {
    const learner = ficha.learners.find(item =>
      item.id === user.id ||
      item.document === user.document ||
      sameText(item.email, user.email),
    );
    if (learner) return { ficha, learner };
  }
  return null;
}

export function findCurrentInstructor(instructors: Instructor[], user: CurrentUserLike) {
  if (!user) return null;
  return instructors.find(instructor =>
    instructor.id === user.id ||
    instructor.userId === user.id ||
    instructor.document === user.document ||
    sameText(instructor.email, user.email),
  ) ?? null;
}

export function getInstructorProgramIds(instructor: Instructor | null) {
  if (!instructor) return [];
  return Array.from(new Set([
    ...(instructor.programIds ?? []),
    ...(instructor.programId ? [instructor.programId] : []),
  ]));
}

export function getFichasForInstructor(
  fichas: Ficha[],
  instructor: Instructor | null,
) {
  if (!instructor) return [];
  if (instructor.fichaIds.length > 0) {
    return fichas.filter(ficha => instructor.fichaIds.includes(ficha.id));
  }

  const programIds = getInstructorProgramIds(instructor);
  return fichas.filter(ficha => programIds.includes(ficha.programId));
}

export function getProgramForFicha(programs: Program[], ficha?: Ficha | null) {
  return ficha ? programs.find(program => program.id === ficha.programId) ?? null : null;
}
