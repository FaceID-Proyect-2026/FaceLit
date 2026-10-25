/** Short-lived authorization held only in memory, never in URLs or persistent storage. */
let authorization: { email: string; token: string } | null = null;
export function rememberRecoveryAuthorization(email: string, token: string): void {
  authorization = { email: email.trim().toLowerCase(), token };
}
export function readRecoveryAuthorization(email: string): string | null {
  return authorization?.email === email.trim().toLowerCase() ? authorization.token : null;
}
export function clearRecoveryAuthorization(): void { authorization = null; }
