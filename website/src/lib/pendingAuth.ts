const KEY = 'olos_pending_email';

export function setPendingEmail(email: string) {
  if (typeof window !== 'undefined') sessionStorage.setItem(KEY, email);
}

export function getPendingEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(KEY);
}

export function clearPendingEmail() {
  if (typeof window !== 'undefined') sessionStorage.removeItem(KEY);
}

/** mual***@gmail.com style masking, matching the Figma copy */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.slice(0, Math.min(4, user.length));
  const stars = '*'.repeat(Math.max(user.length - visible.length, 3));
  return `${visible}${stars}@${domain}`;
}
