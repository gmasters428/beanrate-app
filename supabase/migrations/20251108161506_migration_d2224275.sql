-- Add columns the frontend is selecting so PostgREST stops 400'ing
-- avatar_url mirrors profile_image_url automatically
alter table public.users
  add column if not exists avatar_url text generated always as (profile_image_url) stored,
  add column if not exists avatar_path text;

-- Reload PostgREST schema cache so the new columns are visible immediately
select pg_notify('pgrst', 'reload schema');