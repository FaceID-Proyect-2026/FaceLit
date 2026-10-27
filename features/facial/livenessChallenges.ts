export const LIVENESS_SEQUENCE_LENGTH = 2;
// Fourteen frames for two challenges fit the service's existing fifteen-frame limit.
export const LIVENESS_FRAME_COUNT = 7;
// Keep the neutral baseline plus three seconds to perform and finish the action.
export const LIVENESS_FRAME_DELAY_MS = 500;
export const LIVENESS_PREPARATION_MS = 2000;

export type LivenessChallenge = {
  code: 'BLINK' | 'OPEN_CLOSE_MOUTH' | 'NOD' | 'SHAKE_HEAD' | 'KISS_CAMERA' | 'MOVE_LEFT' | 'MOVE_RIGHT' | 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_CLOSER' | 'MOVE_AWAY';
  label: string;
};

export const LIVENESS_CHALLENGES: LivenessChallenge[] = [
  { code: 'BLINK', label: 'Pestañea una vez' },
  { code: 'OPEN_CLOSE_MOUTH', label: 'Abre y cierra la boca' },
  { code: 'NOD', label: 'Asiente con la cabeza' },
  { code: 'SHAKE_HEAD', label: 'Niega con la cabeza' },
  { code: 'KISS_CAMERA', label: 'Da un beso a la cámara' },
  { code: 'MOVE_LEFT', label: 'Mueve tu rostro hacia la izquierda' },
  { code: 'MOVE_RIGHT', label: 'Mueve tu rostro hacia la derecha' },
  { code: 'MOVE_UP', label: 'Gira tu rostro hacia arriba' },
  { code: 'MOVE_DOWN', label: 'Gira tu rostro hacia abajo' },
  { code: 'MOVE_CLOSER', label: 'Acércate un poco a la cámara' },
  { code: 'MOVE_AWAY', label: 'Aléjate un poco de la cámara' },
];

export function buildLivenessSequence(previousCodes: string[] = []): LivenessChallenge[] {
  const blocked = new Set(previousCodes);
  const shuffled = [...LIVENESS_CHALLENGES]
    .filter((challenge) => !blocked.has(challenge.code))
    .sort(() => Math.random() - 0.5);
  const sequence = shuffled.slice(0, LIVENESS_SEQUENCE_LENGTH);
  if (sequence.length === LIVENESS_SEQUENCE_LENGTH) return sequence;

  const fallback = [...LIVENESS_CHALLENGES]
    .filter((challenge) => !sequence.some((item) => item.code === challenge.code))
    .sort(() => Math.random() - 0.5);
  return [...sequence, ...fallback].slice(0, LIVENESS_SEQUENCE_LENGTH);
}

/** Sustituye solo el reto fallido y conserva el mismo número de paso. */
export function replaceLivenessChallengeAtIndex(
  sequence: LivenessChallenge[],
  index: number,
): LivenessChallenge[] {
  const currentCode = sequence[index]?.code;
  const usedCodes = new Set(
    sequence.filter((_, challengeIndex) => challengeIndex !== index).map((challenge) => challenge.code),
  );
  const replacement = [...LIVENESS_CHALLENGES]
    .filter((challenge) => challenge.code !== currentCode && !usedCodes.has(challenge.code))
    .sort(() => Math.random() - 0.5)[0]
    ?? LIVENESS_CHALLENGES.find((challenge) => challenge.code !== currentCode)
    ?? LIVENESS_CHALLENGES[0];

  return sequence.map((challenge, challengeIndex) => (
    challengeIndex === index ? replacement : challenge
  ));
}

export function formatLivenessStep(challenge: LivenessChallenge, index: number): string {
  return `${index > 0 ? 'Primer reto correcto. ' : ''}Paso ${index + 1}/${LIVENESS_SEQUENCE_LENGTH}: ${challenge.label}`;
}

export function buildChallengeFailureMessage(challenge: LivenessChallenge, reason?: string): string {
  const detail = reason?.match(/El reto era[^.]*\./)?.[0]
    ?? `El reto era ${challenge.label.toLowerCase()}.`;
  return `Detalle: ${detail}`;
}

export function clampLivenessIndex(index: number): number {
  return Math.min(Math.max(index, 0), LIVENESS_SEQUENCE_LENGTH - 1);
}
