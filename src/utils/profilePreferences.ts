export interface UserPreferences {
  firstName?: string;
  region?: string;
  coffeeTypes?: string[];
}

export function parseUserPreferences(
  input: string | null | undefined | UserPreferences
): UserPreferences | null {
  if (!input) return null;

  if (typeof input === "object") {
    return input;
  }

  try {
    const parsed = JSON.parse(input);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed.firstName || parsed.region || parsed.coffeeTypes)
    ) {
      return parsed as UserPreferences;
    }
  } catch {
    // Not valid JSON, return null
  }

  return null;
}
