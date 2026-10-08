// A gallery stays open through its whole expiry day (UTC calendar date).
export function isExpired(expiresOn: string | null, now = new Date()): boolean {
  return !!expiresOn && now.toISOString().slice(0, 10) > expiresOn
}
