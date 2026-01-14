import { supabase } from "@/integrations/supabase/client";

const DEFAULT_BUCKET_CANDIDATES = ["images", "avatars"] as const;
const PROFILE_BUCKET_CANDIDATES = ["profiles", "profile-images", "avatars", "images"] as const;
const BEAN_BUCKET_CANDIDATES = ["coffee-beans", "beans", "images"] as const;

const getBucketCandidatesForPath = (path?: string): string[] => {
  const prefix = path?.split("/")[0];
  let candidates: readonly string[] = DEFAULT_BUCKET_CANDIDATES;

  if (prefix === "profiles") {
    candidates = PROFILE_BUCKET_CANDIDATES;
  } else if (prefix === "coffee-beans") {
    candidates = BEAN_BUCKET_CANDIDATES;
  }

  return Array.from(new Set(candidates));
};

const isBucketMissingError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: string }).message) : "";
  return message.toLowerCase().includes("bucket not found");
};

export const getImageBucketCandidates = (path?: string): readonly string[] =>
  getBucketCandidatesForPath(path);

export const uploadImageWithFallback = async (
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
): Promise<{ bucket: string; path: string; publicUrl: string }> => {
  let lastError: unknown;

  const bucketCandidates = getBucketCandidatesForPath(path);

  for (const bucket of bucketCandidates) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, options);
    if (!error && data?.path) {
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      return { bucket, path: data.path, publicUrl: publicData.publicUrl };
    }

    if (error && !isBucketMissingError(error)) {
      throw error;
    }

    lastError = error;
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error("Storage upload failed: no available buckets");
};

export const parseSupabaseStorageUrl = (
  url: string
): { bucket: string; path: string } | null => {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)/);
    if (!match) return null;
    return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {
    return null;
  }
};

export const isBucketNotFound = isBucketMissingError;
