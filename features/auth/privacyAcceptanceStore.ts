// ─────────────────────────────────────────────
//  features/auth/privacyAcceptanceStore.ts
//  Registro simple (mock) de qué usuarios ya
//  aceptaron el aviso de privacidad alguna vez,
//  para que el login no lo vuelva a pedir.
// ─────────────────────────────────────────────

const acceptedEmails = new Set<string>();

function normalize(email: string) {
  return email.trim().toLowerCase();
}

export function hasAcceptedPrivacy(email: string): boolean {
  return acceptedEmails.has(normalize(email));
}

export function recordPrivacyAcceptance(email: string): void {
  acceptedEmails.add(normalize(email));
}
