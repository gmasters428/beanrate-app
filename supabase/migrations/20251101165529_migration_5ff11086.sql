-- 1) Add foreign keys only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'friendships_user_one_id_fkey' 
    AND conrelid = 'public.friendships'::regclass
  ) THEN
    ALTER TABLE public.friendships
      ADD CONSTRAINT friendships_user_one_id_fkey
      FOREIGN KEY (user_one_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'friendships_user_two_id_fkey' 
    AND conrelid = 'public.friendships'::regclass
  ) THEN
    ALTER TABLE public.friendships
      ADD CONSTRAINT friendships_user_two_id_fkey
      FOREIGN KEY (user_two_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_one ON public.friendships(user_one_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_two ON public.friendships(user_two_id);