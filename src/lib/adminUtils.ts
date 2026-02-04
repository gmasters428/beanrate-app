// Admin utility functions
const STATIC_ADMIN_EMAILS = [
  "gmasters428@gmail.com",
  "garrett@gtalkstech.com",
  "bud8car2006@aol.com",
];

const parseAdminEmails = (value?: string | null): string[] => {
  if (!value) return [];
  return value
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const ADMIN_EMAILS = [
  ...STATIC_ADMIN_EMAILS,
  ...parseAdminEmails(process.env.NEXT_PUBLIC_ADMIN_EMAILS),
  ...parseAdminEmails(process.env.NEXT_PUBLIC_DEV_SMOKE_EMAIL),
];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
