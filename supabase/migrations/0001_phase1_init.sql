-- PreLab — Phase 1 schema (auth, profiles, presets, like/save/follow)
-- Backend: Supabase (Postgres + Auth + Storage), browser-called with RLS.
-- Aligned with the "share BandLab-made presets" intent: no preset API, so a
-- preset is a user-entered record (bandlab_url + manual fx_chain + cover).

-- ─────────────────────────── PROFILES ───────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        citext unique not null,
  display_name  text not null default '',
  avatar_url    text,
  bio           text default '',
  social_links  jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────── PRESETS ────────────────────────────
create type public.preset_visibility as enum ('public', 'unlisted', 'private');

create table if not exists public.presets (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles(id) on delete cascade,
  title          text not null check (char_length(title) between 1 and 120),
  description    text default '',
  bandlab_url    text,                         -- the user's BandLab share link
  track_type     text,                         -- Vocals / Bass / Drums / ...
  genre          text,                         -- Trap / R&B / Drill / ...
  fx_chain       jsonb not null default '[]'::jsonb,  -- [{effect, params:{}}]
  cover_url      text,                         -- uploaded cover (storage)
  visibility     public.preset_visibility not null default 'public',
  like_count     integer not null default 0,
  save_count     integer not null default 0,
  comment_count  integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists presets_author_created_idx on public.presets (author_id, created_at desc);
create index if not exists presets_created_idx on public.presets (created_at desc);

-- ─────────────────── LIKES / SAVES / FOLLOWS ────────────────────
create table if not exists public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  preset_id  uuid not null references public.presets(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, preset_id)
);

create table if not exists public.saves (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  preset_id  uuid not null references public.presets(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, preset_id)
);

create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  followee_id  uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- ─────────── new auth user → auto-create a profile row ───────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────── denormalized counters kept current by triggers ───────────
create or replace function public.bump_count(tbl regclass, col text, id uuid, delta int)
returns void language plpgsql as $$
begin
  execute format('update %s set %I = greatest(0, %I + $1) where id = $2', tbl, col, col)
    using delta, id;
end; $$;

create or replace function public.likes_count_trg() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then perform public.bump_count('public.presets','like_count', new.preset_id, 1);
  elsif tg_op = 'DELETE' then perform public.bump_count('public.presets','like_count', old.preset_id, -1);
  end if; return null;
end; $$;
create trigger likes_count after insert or delete on public.likes
  for each row execute function public.likes_count_trg();

create or replace function public.saves_count_trg() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then perform public.bump_count('public.presets','save_count', new.preset_id, 1);
  elsif tg_op = 'DELETE' then perform public.bump_count('public.presets','save_count', old.preset_id, -1);
  end if; return null;
end; $$;
create trigger saves_count after insert or delete on public.saves
  for each row execute function public.saves_count_trg();

-- ────────────────────────── RLS POLICIES ─────────────────────────
alter table public.profiles enable row level security;
alter table public.presets  enable row level security;
alter table public.likes    enable row level security;
alter table public.saves    enable row level security;
alter table public.follows  enable row level security;

-- profiles: world-readable, self-writable
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- presets: public ones readable by all; owner sees own; owner writes own
create policy presets_read    on public.presets for select
  using (visibility = 'public' or author_id = auth.uid());
create policy presets_insert  on public.presets for insert with check (author_id = auth.uid());
create policy presets_update  on public.presets for update using (author_id = auth.uid());
create policy presets_delete  on public.presets for delete using (author_id = auth.uid());

-- likes / saves: readable by all (for counts/state), only self can add/remove own
create policy likes_read   on public.likes  for select using (true);
create policy likes_write  on public.likes  for insert with check (user_id = auth.uid());
create policy likes_delete on public.likes  for delete using (user_id = auth.uid());
create policy saves_read   on public.saves  for select using (true);
create policy saves_write  on public.saves  for insert with check (user_id = auth.uid());
create policy saves_delete on public.saves  for delete using (user_id = auth.uid());

-- follows: readable by all, only self can follow/unfollow as the follower
create policy follows_read   on public.follows for select using (true);
create policy follows_write  on public.follows for insert with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete using (follower_id = auth.uid());
