-- 3) Minimal RLS so auth users can read their friendships and basic user rows
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='friendships' AND policyname='read-own-friendships'
  ) THEN
    CREATE POLICY "read-own-friendships"
      ON public.friendships
      FOR SELECT
      TO authenticated
      USING (user_one_id = auth.uid() OR user_two_id = auth.uid());
  END IF;
END$$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users' AND policyname='read-users-basic'
  ) THEN
    CREATE POLICY "read-users-basic"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END$$;