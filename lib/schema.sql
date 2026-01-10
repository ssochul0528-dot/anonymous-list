
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- PROFILES Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  nickname text,
  real_name text,
  bio text,
  style text, -- '공격' | '수비' | '올라운드'
  hand text, -- '오른손' | '왼손'
  position text, -- '네트' | '베이스라인' | '무관'
  level text, -- '1' ~ '5'
  photo_url text,
  role text default 'USER', -- 'USER' | 'ADMIN'
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(nickname) >= 2)
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nickname, role)
  values (new.id, new.email, split_part(new.email, '@', 1), 'USER');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEASONS Table
create table public.seasons (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- '2026-01'
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- WEEKS Table
create table public.weeks (
  id uuid default uuid_generate_v4() primary key,
  season_id uuid references public.seasons(id),
  label text not null, -- '1주차'
  is_closed boolean default false,
  created_at timestamp with time zone default now()
);

-- MATCHES Table
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.weeks(id),
  round_number integer not null,
  court_label text not null, -- 'A', 'B', 'C'
  created_at timestamp with time zone default now()
);

-- MATCH_PARTICIPANTS (Links Match <-> Profile)
create table public.match_participants (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id),
  user_id uuid references public.profiles(id),
  team text not null, -- 'A' or 'B'
  guest_name text -- if user_id is null
);

-- SCORES Table (Flat structure for simpler Leaderboard)
create table public.scores (
  id uuid default uuid_generate_v4() primary key,
  week_id uuid references public.weeks(id),
  user_id uuid references public.profiles(id),
  points numeric not null default 0, -- Win=3, Draw=1, Loss=0.5
  result text, -- 'WIN', 'DRAW', 'LOSS'
  match_id uuid references public.matches(id), -- Optional link to match
  created_at timestamp with time zone default now()
);

-- RLS Policies for Game Data (Simplified: Read All, Admin Write All)
-- In a real app, strict RLS is needed. For MVP:

alter table seasons enable row level security;
alter table weeks enable row level security;
alter table matches enable row level security;
alter table match_participants enable row level security;
alter table scores enable row level security;

create policy "Enable read access for all users" on seasons for select using (true);
create policy "Enable read access for all users" on weeks for select using (true);
create policy "Enable read access for all users" on matches for select using (true);
create policy "Enable read access for all users" on match_participants for select using (true);
create policy "Enable read access for all users" on scores for select using (true);

-- Allow authenticated users to insert their own scores (or Admin inserts all)
-- For this app, ADMIN generates schedule, USER enters score?
-- Requirement: "USER는 본인이 참가한 경기 또는 본인 점수만 입력 가능"
create policy "Users can insert own scores" on scores for insert with check (auth.uid() = user_id);
create policy "Users can update own scores" on scores for update using (auth.uid() = user_id);

-- Admin policies (assuming hardcoded admin email or role check)
-- For MVP, use a simple check or manual admin assignment in DB

-- STORAGE: Create 'avatars' bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- STORAGE POLICIES
-- 1. Public Access to view avatars
create policy "Give public access to avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 2. Authenticated users can upload avatars
create policy "Allow authenticated uploads"
on storage.objects for insert
with check (
  bucket_id = 'avatars' and
  auth.role() = 'authenticated'
);

-- 3. Users can update their own avatars (optional, usually insert is enough if overwriting with same name, but good to have)
create policy "Allow users to update own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars' and
  auth.uid() = owner
);
