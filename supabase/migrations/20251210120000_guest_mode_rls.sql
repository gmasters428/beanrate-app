-- Guest mode RLS: public read, authenticated write for user-generated tables

ALTER TABLE public.coffee_beans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='coffee_beans' AND policyname='coffee_beans.read.public'
  ) THEN
    CREATE POLICY "coffee_beans.read.public"
      ON public.coffee_beans
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='coffee_beans' AND policyname='coffee_beans.insert.authenticated'
  ) THEN
    CREATE POLICY "coffee_beans.insert.authenticated"
      ON public.coffee_beans
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='coffee_beans' AND policyname='coffee_beans.update.authenticated'
  ) THEN
    CREATE POLICY "coffee_beans.update.authenticated"
      ON public.coffee_beans
      FOR UPDATE
      TO authenticated
      USING (auth.uid() IS NOT NULL)
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='coffee_beans' AND policyname='coffee_beans.delete.authenticated'
  ) THEN
    CREATE POLICY "coffee_beans.delete.authenticated"
      ON public.coffee_beans
      FOR DELETE
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ratings' AND policyname='ratings.read.public'
  ) THEN
    CREATE POLICY "ratings.read.public"
      ON public.ratings
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ratings' AND policyname='ratings.insert.own'
  ) THEN
    CREATE POLICY "ratings.insert.own"
      ON public.ratings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ratings' AND policyname='ratings.update.own'
  ) THEN
    CREATE POLICY "ratings.update.own"
      ON public.ratings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='ratings' AND policyname='ratings.delete.own'
  ) THEN
    CREATE POLICY "ratings.delete.own"
      ON public.ratings
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='comments' AND policyname='comments.read.public'
  ) THEN
    CREATE POLICY "comments.read.public"
      ON public.comments
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='comments' AND policyname='comments.insert.own'
  ) THEN
    CREATE POLICY "comments.insert.own"
      ON public.comments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='comments' AND policyname='comments.update.own'
  ) THEN
    CREATE POLICY "comments.update.own"
      ON public.comments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='comments' AND policyname='comments.delete.own'
  ) THEN
    CREATE POLICY "comments.delete.own"
      ON public.comments
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='likes' AND policyname='likes.read.public'
  ) THEN
    CREATE POLICY "likes.read.public"
      ON public.likes
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='likes' AND policyname='likes.insert.own'
  ) THEN
    CREATE POLICY "likes.insert.own"
      ON public.likes
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='likes' AND policyname='likes.delete.own'
  ) THEN
    CREATE POLICY "likes.delete.own"
      ON public.likes
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='friendships' AND policyname='friendships.read.accepted.public'
  ) THEN
    CREATE POLICY "friendships.read.accepted.public"
      ON public.friendships
      FOR SELECT
      TO public
      USING (status = 'accepted');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='friendships' AND policyname='friendships.read.participant'
  ) THEN
    CREATE POLICY "friendships.read.participant"
      ON public.friendships
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='friendships' AND policyname='friendships.insert.requester'
  ) THEN
    CREATE POLICY "friendships.insert.requester"
      ON public.friendships
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_one_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='friendships' AND policyname='friendships.update.participant'
  ) THEN
    CREATE POLICY "friendships.update.participant"
      ON public.friendships
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_one_id OR auth.uid() = user_two_id)
      WITH CHECK (auth.uid() = user_one_id OR auth.uid() = user_two_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='friendships' AND policyname='friendships.delete.participant'
  ) THEN
    CREATE POLICY "friendships.delete.participant"
      ON public.friendships
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='users' AND policyname='users.read.public'
  ) THEN
    CREATE POLICY "users.read.public"
      ON public.users
      FOR SELECT
      TO public
      USING (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='follows' AND policyname='follows.read.own'
  ) THEN
    CREATE POLICY "follows.read.own"
      ON public.follows
      FOR SELECT
      TO authenticated
      USING (auth.uid() = follower_id OR auth.uid() = following_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='follows' AND policyname='follows.insert.own'
  ) THEN
    CREATE POLICY "follows.insert.own"
      ON public.follows
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = follower_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='follows' AND policyname='follows.delete.own'
  ) THEN
    CREATE POLICY "follows.delete.own"
      ON public.follows
      FOR DELETE
      TO authenticated
      USING (auth.uid() = follower_id);
  END IF;
END$$;
