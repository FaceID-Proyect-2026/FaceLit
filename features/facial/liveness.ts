export type Pose = 'center' | 'left' | 'right';
export interface FaceSample {
  pose: Pose; yaw: number; real: number; live: number; embedding: number[];
}

// Human returns radians. Keep thresholds aligned with the API.
export function matchesPose(pose: Pose, yaw: number): boolean {
  if (!Number.isFinite(yaw)) return false;
  if (pose === 'center') return Math.abs(yaw) <= 0.18;
  return pose === 'left' ? yaw >= 0.18 && yaw <= 0.85 : yaw <= -0.18 && yaw >= -0.85;
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
