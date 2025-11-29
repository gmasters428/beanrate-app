import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface UserPreferences {
  firstName?: string;
  region?: string;
  coffeeTypes?: string[];
}

export function formatUserPreferences(
  input: string | null | undefined | UserPreferences
): string {
  if (!input) {
    return "No bio yet";
  }

  // If it's already an object, format it
  if (typeof input === "object") {
    const parts: string[] = [];
    if (input.firstName) parts.push(input.firstName);
    if (input.region) parts.push(input.region);
    if (input.coffeeTypes && input.coffeeTypes.length > 0) {
      parts.push(input.coffeeTypes.join(", "));
    }
    return parts.length > 0 ? parts.join(" • ") : "No bio yet";
  }

  // If it's a string, try to parse it as JSON
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      // Check if it matches our expected shape
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed.firstName || parsed.region || parsed.coffeeTypes)
      ) {
        const parts: string[] = [];
        if (parsed.firstName) parts.push(parsed.firstName);
        if (parsed.region) parts.push(parsed.region);
        if (Array.isArray(parsed.coffeeTypes) && parsed.coffeeTypes.length > 0) {
          parts.push(parsed.coffeeTypes.join(", "));
        }
        return parts.length > 0 ? parts.join(" • ") : input;
      }
    } catch {
      // If JSON parsing fails, return the original string
      return input;
    }
    // If parsing succeeded but shape doesn't match, return original string
    return input;
  }

  return "No bio yet";
}
