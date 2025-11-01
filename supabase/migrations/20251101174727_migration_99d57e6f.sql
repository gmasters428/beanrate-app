-- Decide which table the friendship IDs actually reference (public.users vs auth.users),
-- clean orphans, add the right FKs + indexes, and reload PostgREST schema cache.

do $$
declare
  matches_public int := 0;
  matches_auth   int := 0;
  target_schema  text;
  target_table   text;
begin
  -- Count rows where BOTH ends of a friendship exist in public.users
  select count(*) into matches_public
  from public.friendships f
  join public.users u1 on u1.id = f.user_one_id
  join public.users u2 on u2.id = f.user_two_id;

  -- Count rows where BOTH ends exist in auth.users
  select count(*) into matches_auth
  from public.friendships f
  join auth.users u1 on u1.id = f.user_one_id
  join auth.users u2 on u2.id = f.user_two_id;

  if matches_public >= matches_auth then
    target_schema := 'public';
    target_table  := 'users';
  else
    target_schema := 'auth';
    target_table  := 'users';
  end if;

  -- Drop any previous constraints if they exist (we'll recreate correctly)
  begin
    alter table public.friendships drop constraint if exists friendships_user_one_id_fkey;
    alter table public.friendships drop constraint if exists friendships_user_two_id_fkey;
    alter table public.friendships drop constraint if exists fk_friend_user_one;
    alter table public.friendships drop constraint if exists fk_friend_user_two;
  exception when undefined_object then
    -- ignore
    null;
  end;

  -- Remove orphan friendships that would fail FK validation
  -- (rows where either endpoint doesn't exist in the chosen target table)
  execute format($q$
    delete from public.friendships f
    where not exists (select 1 from %I.%I u where u.id = f.user_one_id)
       or not exists (select 1 from %I.%I u where u.id = f.user_two_id)
  $q$, target_schema, target_table, target_schema, target_table);

  -- Create canonical ordering guard + unique pair (prevents dup/inverted duplicates)
  begin
    alter table public.friendships add constraint friendships_order check (user_one_id < user_two_id);
  exception when duplicate_object then null;
  end;

  create unique index if not exists ux_friendships_pair
    on public.friendships (least(user_one_id,user_two_id), greatest(user_one_id,user_two_id));

  -- Add the correct foreign keys (cascade on delete)
  execute format($q$
    alter table public.friendships
      add constraint friendships_user_one_id_fkey
        foreign key (user_one_id) references %I.%I(id) on delete cascade,
      add constraint friendships_user_two_id_fkey
        foreign key (user_two_id) references %I.%I(id) on delete cascade
  $q$, target_schema, target_table, target_schema, target_table);

  -- Helpful read-path indexes
  create index if not exists idx_friendships_user_one on public.friendships(user_one_id);
  create index if not exists idx_friendships_user_two on public.friendships(user_two_id);

  -- Tell PostgREST to reload schema so the new relationships are visible immediately
  perform pg_notify('pgrst', 'reload schema');
end$$;