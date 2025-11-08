-- Enable RLS on public.users
alter table public.users enable row level security;

-- Drop existing policies if they exist, then create new ones
drop policy if exists "users.read.all" on public.users;
create policy "users.read.all" 
  on public.users 
  for select 
  to authenticated 
  using (true);

drop policy if exists "users.update.self" on public.users;
create policy "users.update.self" 
  on public.users 
  for update 
  to authenticated 
  using (id = auth.uid()) 
  with check (id = auth.uid());

-- Create trigger function to auto-create profile on auth.users insert
create or replace function public.handle_new_auth_user() 
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
begin
  -- Extract username from email (before @)
  insert into public.users (id, username, display_name)
  values (
    new.id,
    regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '_', 'g'),
    regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9]', '_', 'g')
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

-- Drop and recreate trigger to ensure it's up to date
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- Create RPC to backfill profile for existing users (idempotent)
create or replace function public.ensure_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_username text;
begin
  -- Get current user info
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get email from auth.users
  select email into v_email
  from auth.users
  where id = v_user_id;
  
  if v_email is null then
    raise exception 'User email not found';
  end if;
  
  -- Generate username from email
  v_username := regexp_replace(split_part(v_email, '@', 1), '[^a-zA-Z0-9]', '_', 'g');
  
  -- Upsert user profile
  insert into public.users (id, username, display_name)
  values (v_user_id, v_username, v_username)
  on conflict (id) do nothing;
  
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.ensure_user_profile() to authenticated;

-- Create case-insensitive unique index on username
create unique index if not exists ux_users_username_lower 
  on public.users (lower(username));

-- Notify PostgREST to reload schema
select pg_notify('pgrst', 'reload schema');