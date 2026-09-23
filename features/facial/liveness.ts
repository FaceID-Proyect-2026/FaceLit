export type Pose = 'center' | 'left' | 'right' | 'blink' | 'blink_twice' | 'smile';
export interface FaceSample {
  pose: Pose; yaw: number; real: number; live: number; embedding: number[];
  elapsedMs: number; durationMs: number; frames: number; blinks: number; smileTransition: boolean;
}

// Human returns radians. Keep thresholds aligned with the API.
export function matchesPose(pose: Pose, yaw: number): boolean {
  if (!Number.isFinite(yaw)) return false;
  if (['center', 'blink', 'blink_twice', 'smile'].includes(pose)) return Math.abs(yaw) <= 0.18;
  return pose === 'left' ? yaw >= 0.18 && yaw <= 0.85 : yaw <= -0.18 && yaw >= -0.85;
}

/** Image-space eye aspect ratio. This is a gesture cue, not measured 3D depth. */
export function eyeOpenness(mesh: [number, number, ...unknown[]][]): number {
  const distance = (a: number, b: number) => {
    if (!mesh[a] || !mesh[b]) return NaN;
    return Math.hypot(mesh[a][0] - mesh[b][0], mesh[a][1] - mesh[b][1]);
  };
  return (distance(159, 145) / distance(33, 133) + distance(386, 374) / distance(362, 263)) / 2;
}

/** Requires fresh observations and open -> closed -> open / neutral -> smile transitions. */
export class ActiveChallenge {
  private started = -1;
  private previous = -1;
  private frames = 0;
  private opened = false;
  private closedAt = -1;
  private blinks = 0;
  private neutral = false;
  private smileSince = -1;

  reset() {
    this.started = -1; this.previous = -1; this.frames = 0;
    this.opened = false; this.closedAt = -1; this.blinks = 0;
    this.neutral = false; this.smileSince = -1;
  }

  observe(pose: Pose, now: number, yaw: number, eyes: number, happy: number) {
    if (!matchesPose(pose, yaw) || !Number.isFinite(now) || now <= this.previous) {
      this.reset(); return null;
    }
    if (this.previous >= 0 && now - this.previous > 1000) this.reset();
    this.previous = now;
    if (this.started < 0) this.started = now;
    this.frames++;
    if (pose === 'blink' || pose === 'blink_twice') {
      if (!Number.isFinite(eyes)) { this.reset(); return null; }
      if (eyes >= 0.23) {
        if (this.closedAt >= 0) {
          const duration = now - this.closedAt;
          if (duration >= 60 && duration <= 800) this.blinks++;
          else { this.reset(); return null; }
        }
        this.opened = true; this.closedAt = -1;
      } else if (eyes <= 0.16 && this.opened && this.closedAt < 0) {
        this.closedAt = now; this.opened = false;
      }
      if (this.closedAt >= 0 && now - this.closedAt > 800) { this.reset(); return null; }
    }
    if (pose === 'smile') {
      if (!Number.isFinite(happy)) { this.reset(); return null; }
      if (happy < 0.25) this.neutral = true;
      if (this.neutral && happy >= 0.75) {
        if (this.smileSince < 0) this.smileSince = now;
      } else this.smileSince = -1;
    }
    const durationMs = now - this.started;
    const requiredBlinks = pose === 'blink' ? 1 : pose === 'blink_twice' ? 2 : 0;
    const smileTransition = this.smileSince >= 0 && now - this.smileSince >= 400;
    if (durationMs < 650 || this.frames < 4 || this.blinks !== requiredBlinks
        || (pose === 'smile' && !smileTransition) || this.closedAt >= 0) return null;
    return { durationMs, frames: this.frames, blinks: this.blinks, smileTransition };
  }
}
export function validEmbedding(embedding?: number[]): embedding is number[] {
  return !!embedding && embedding.length === 1024 && embedding.every(Number.isFinite)
    && embedding.some(value => value !== 0);
}
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!validEmbedding(a) || !validEmbedding(b)) return 0;
  return a.reduce((sum, v, i) => sum + v * b[i], 0)
    / Math.sqrt(a.reduce((sum, v) => sum + v * v, 0) * b.reduce((sum, v) => sum + v * v, 0));
}
