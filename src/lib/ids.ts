
/**
 * UUID validation helper
 * Checks if a string matches the UUID v4 format
 */
export const isUUID = (s: string): boolean => {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
};
