-- Allow multiple ratings per user per bean by dropping the uniqueness constraint
-- This migration is idempotent - it checks if the constraint exists before dropping

DO $$
BEGIN
  -- Check if the unique constraint exists and drop it
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ratings_user_id_coffee_bean_id_key'
      AND conrelid = 'public.ratings'::regclass
  ) THEN
    ALTER TABLE public.ratings DROP CONSTRAINT ratings_user_id_coffee_bean_id_key;
    RAISE NOTICE 'Dropped unique constraint ratings_user_id_coffee_bean_id_key';
  ELSE
    RAISE NOTICE 'Constraint ratings_user_id_coffee_bean_id_key does not exist, skipping';
  END IF;
END $$;

-- Notify PostgREST to reload schema
SELECT pg_notify('pgrst', 'reload schema');