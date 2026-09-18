-- The Hub Social — Circles & Events schema
-- Drop-in for the existing thehubsocials Supabase project.
-- Pairs with Google OAuth via Supabase Auth (enable the Google provider
-- in Authentication > Providers, no separate user table needed —
-- auth.users is the source of truth; profiles extends it).

create extension if not exists "pgcrypto";

-- Extends auth.users with the public fields the app needs
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  avatar_url text,
  area text check (area in ('Waldrift','Arcon Park','Vereeniging CBD','Surrounding area')),
  created_at timestamptz not null default now()
);

-- A recurring or one-off group someone has started
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('running','gaming','reading','music','art','food','other')),
  area text not null check (area in ('Waldrift','Arcon Park','Vereeniging CBD','Surrounding area')),
  description text not null,
  location text not null,
  recurring text,               -- human-readable cadence, e.g. "Every Tuesday, 6 PM"
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- A specific dated occurrence of a circle (supports recurring circles
-- having many upcoming instances, or one-off circles having exactly one)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Who's going to a given event
create table if not exists public.attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create index if not exists idx_circles_category on public.circles(category);
create index if not exists idx_circles_area on public.circles(area);
create index if not exists idx_events_circle on public.events(circle_id);
create index if not exists idx_events_starts_at on public.events(starts_at);

-- Row Level Security: anyone signed in can read; only the owner can
-- edit/delete their own circle; anyone signed in can create and RSVP.
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.events enable row level security;
alter table public.attendees enable row level security;

create policy "profiles are publicly readable" on public.profiles
  for select using (true);
create policy "users manage their own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "users insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "circles are publicly readable" on public.circles
  for select using (true);
create policy "signed-in users create circles" on public.circles
  for insert with check (auth.uid() = created_by);
create policy "owners update their circles" on public.circles
  for update using (auth.uid() = created_by);
create policy "owners delete their circles" on public.circles
  for delete using (auth.uid() = created_by);

create policy "events are publicly readable" on public.events
  for select using (true);
create policy "circle owners manage events" on public.events
  for all using (
    exists (select 1 from public.circles c where c.id = circle_id and c.created_by = auth.uid())
  );

create policy "attendees are publicly readable" on public.attendees
  for select using (true);
create policy "users manage their own rsvp" on public.attendees
  for all using (auth.uid() = profile_id);

-- Auto-create a profiles row when someone signs in via Google for the first time
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New member'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
