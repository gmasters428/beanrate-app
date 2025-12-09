// Admin utility functions
export const ADMIN_EMAILS = ['gmasters428@gmail.com'];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}