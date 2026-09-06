const acceptedPrivacyEmails = new Set<string>();

export function hasAcceptedPrivacy(email: string): boolean {
  return acceptedPrivacyEmails.has(email.trim().toLowerCase());
}

export function recordPrivacyAcceptance(email: string): void {
  acceptedPrivacyEmails.add(email.trim().toLowerCase());
}