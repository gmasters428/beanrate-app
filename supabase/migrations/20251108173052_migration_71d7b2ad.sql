-- Add columns the frontend is selecting so PostgREST stops 400'ing
-- avatar_url mirrors profile_image_url automatically
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT GENERATED ALWAYS AS (profile_image_url) STORED,
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- Add comment to explain the generated column
COMMENT ON COLUMN public.users.avatar_url IS 'Generated column that mirrors profile_image_url for compatibility';
COMMENT ON COLUMN public.users.avatar_path IS 'Optional storage path for avatars stored in Supabase Storage';