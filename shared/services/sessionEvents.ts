const listeners = new Set<() => void>();
export function onSessionRejected(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function notifySessionRejected(): void { listeners.forEach(listener => listener()); }
