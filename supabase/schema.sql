-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  name         text not null default '',
  age          integer check (age >= 17 and age <= 35),
  school       text not null default '',
  major        text not null default '',
  grad_year    integer,
  bio          text default '',
  photos       text[] default '{}',
  is_onboarded boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── Preferences ──────────────────────────────────────────────────────────────
create table public.preferences (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references public.profiles(id) on delete cascade unique not null,
  sleep_schedule      text check (sleep_schedule in ('early_bird', 'night_owl', 'flexible')),
  cleanliness         integer check (cleanliness between 1 and 5),
  noise_level         text check (noise_level in ('quiet', 'moderate', 'lively')),
  guests              text check (guests in ('rarely', 'occasionally', 'frequently')),
  smoking             text check (smoking in ('yes', 'no', 'okay_with_it')),
  drinking            text check (drinking in ('yes', 'no', 'okay_with_it')),
  pets                text check (pets in ('yes', 'no', 'okay_with_it')),
  study_habits        text check (study_habits in ('at_home', 'library', 'mixed')),
  budget_min          integer check (budget_min >= 0),
  budget_max          integer check (budget_max >= 0),
  move_in_date        date,
  lease_duration      text check (lease_duration in ('3_months', '6_months', '12_months', 'flexible')),
  location_preference text default '',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  check (budget_max >= budget_min)
);

-- ─── Swipes ───────────────────────────────────────────────────────────────────
create table public.swipes (
  id         uuid default uuid_generate_v4() primary key,
  swiper_id  uuid references public.profiles(id) on delete cascade not null,
  swiped_id  uuid references public.profiles(id) on delete cascade not null,
  direction  text check (direction in ('like', 'pass', 'super_like')) not null,
  created_at timestamptz default now(),
  unique (swiper_id, swiped_id),
  check (swiper_id <> swiped_id)
);

-- ─── Matches ──────────────────────────────────────────────────────────────────
-- user1_id < user2_id ensures each pair is stored once
create table public.matches (
  id                  uuid default uuid_generate_v4() primary key,
  user1_id            uuid references public.profiles(id) on delete cascade not null,
  user2_id            uuid references public.profiles(id) on delete cascade not null,
  compatibility_score numeric(5,2),
  created_at          timestamptz default now(),
  unique (user1_id, user2_id),
  check (user1_id < user2_id)
);

-- ─── Conversations ────────────────────────────────────────────────────────────
create table public.conversations (
  id         uuid default uuid_generate_v4() primary key,
  match_id   uuid references public.matches(id) on delete cascade unique not null,
  created_at timestamptz default now()
);

-- ─── Messages ─────────────────────────────────────────────────────────────────
create table public.messages (
  id              uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  content         text not null,
  created_at      timestamptz default now(),
  read_at         timestamptz
);

create index messages_convo_idx on public.messages (conversation_id, created_at desc);

-- ─── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.preferences   enable row level security;
alter table public.swipes        enable row level security;
alter table public.matches       enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- Profiles: all onboarded profiles readable; own profile always readable
create policy "Profiles: read onboarded or own" on public.profiles
  for select to authenticated using (is_onboarded = true or id = auth.uid());
create policy "Profiles: own insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Profiles: own update" on public.profiles
  for update using (auth.uid() = id);

-- Preferences: readable by all authenticated, writable by owner
create policy "Preferences: authenticated read" on public.preferences
  for select to authenticated using (true);
create policy "Preferences: own write" on public.preferences
  for all using (auth.uid() = user_id);

-- Swipes: own only
create policy "Swipes: own read" on public.swipes
  for select using (auth.uid() = swiper_id);
create policy "Swipes: own insert" on public.swipes
  for insert with check (auth.uid() = swiper_id);

-- Matches: participants only
create policy "Matches: participants read" on public.matches
  for select using (auth.uid() = user1_id or auth.uid() = user2_id);

-- Conversations: participants only (via match)
create policy "Conversations: participants read" on public.conversations
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- Messages: participants only (via conversation → match)
create policy "Messages: participants read" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );
create policy "Messages: participants insert" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      join public.matches m on m.id = c.match_id
      where c.id = conversation_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- ─── Trigger: auto-create profile on signup ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Trigger: auto-match on mutual like ──────────────────────────────────────
create or replace function public.handle_mutual_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_user1    uuid;
  v_user2    uuid;
  v_match_id uuid;
begin
  if new.direction not in ('like', 'super_like') then return new; end if;

  if not exists (
    select 1 from public.swipes
    where swiper_id = new.swiped_id and swiped_id = new.swiper_id
      and direction in ('like', 'super_like')
  ) then return new; end if;

  v_user1 := least(new.swiper_id, new.swiped_id);
  v_user2 := greatest(new.swiper_id, new.swiped_id);

  insert into public.matches (user1_id, user2_id)
  values (v_user1, v_user2)
  on conflict do nothing
  returning id into v_match_id;

  if v_match_id is not null then
    insert into public.conversations (match_id) values (v_match_id);
  end if;

  return new;
end;
$$;

create trigger on_swipe_insert
  after insert on public.swipes
  for each row execute function public.handle_mutual_like();

-- ─── Trigger: updated_at ──────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_preferences_updated_at
  before update on public.preferences
  for each row execute function public.handle_updated_at();
