// Nota: la lógica activa vive en privacyAcceptanceStore.ts. Este archivo
// se mantiene por compatibilidad con imports existentes, actualizado al
// mismo criterio (documento, no correo) tras RF-1.1 V3.
const acceptedPrivacyDocuments = new Set<string>();

export function hasAcceptedPrivacy(document: string): boolean {
  if (!document.trim()) return false;
  return acceptedPrivacyDocuments.has(document.trim());
}

export function recordPrivacyAcceptance(document: string): void {
  if (!document.trim()) return;
  acceptedPrivacyDocuments.add(document.trim());
}