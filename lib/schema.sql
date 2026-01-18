
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
  role text default 'USER', -- 'USER' | 'STAFF' | 'PRESIDENT' | 'ADMIN'
  racket text,
  string_tension text,
  pref_time_days text, -- '주말' | '평일' | '무관'
  pref_time_slots text, -- '아침' | '점심' | '저녁'
  pref_court_env text, -- '실내' | '실외'
  pref_court_type text, -- '클레이' | '하드' | '인조잔디'
  pref_side text, -- '포사이드' | '백사이드' | '무관'
  skill_serve integer default 50,
  skill_forehand integer default 50,
  skill_backhand integer default 50,
  skill_volley integer default 50,
  skill_stamina integer default 50,
  skill_manner integer default 50,
  badges text[] default '{}',
  color text default '#D4AF37',
  membership_type text default 'NONE', -- 'MONTHLY' | 'ANNUAL' | 'NONE'
  membership_until date,
  bank_info text, -- Format: "Bank Name 123-456-789"
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
  values (
    new.id, 
    new.email, 
    split_part(new.email, '@', 1), 
    case 
      when new.email = 'ssochul@naver.com' then 'PRESIDENT'
      else 'USER'
    end
  );
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
create policy "Users can delete own scores" on scores for delete using (auth.uid() = user_id);

-- Admin policies (assuming hardcoded admin email or role check)
-- For MVP, use a simple check or manual admin assignment in DB
create policy "Privileged roles can manage all scores" on public.scores for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('PRESIDENT', 'STAFF', 'ADMIN')));

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

-- ATTENDANCE Table
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  target_date date not null, -- Every Wednesday date
  status text not null, -- 'ATTEND' | 'ABSENT'
  preferred_time text, -- '08:00' | '09:00'
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique(user_id, target_date)
);

alter table public.attendance enable row level security;

create policy "Attendance is viewable by everyone."
  on public.attendance for select
  using ( true );

create policy "Users can check their own attendance."
  on public.attendance for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own attendance."
  on public.attendance for update
  using ( auth.uid() = user_id );

-- SETTLEMENTS & MEMBERSHIP MANAGEMENT
-- 1. Dues Configuration
create table public.dues_config (
  id uuid default uuid_generate_v4() primary key,
  monthly_fee numeric default 30000,
  annual_fee numeric default 300000,
  guest_fee numeric default 10000,
  updated_at timestamp with time zone default now()
);

-- 2. Settlements (Revenue)
create table public.settlements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  payer_name text not null, -- Display name or actual sender name
  amount numeric not null,
  type text not null, -- 'MONTHLY' | 'ANNUAL' | 'GUEST' | 'OTHER'
  method text not null, -- 'CASH' | 'TRANSFER'
  status text default 'UNPAID', -- 'UNPAID' | 'PENDING' | 'PAID'
  notes text,
  confirmed_at timestamp with time zone,
  confirmed_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- 3. Expenses
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  item_name text not null,
  amount numeric not null,
  expense_date date default current_date,
  notes text,
  created_at timestamp with time zone default now()
);

-- RLS for Settlements & Expenses
alter table public.dues_config enable row level security;
alter table public.settlements enable row level security;
alter table public.expenses enable row level security;

create policy "Dues config is viewable by everyone" on public.dues_config for select using (true);
create policy "Settlements are viewable by everyone" on public.settlements for select using (true);
create policy "Expenses are viewable by everyone" on public.expenses for select using (true);

-- Only PRESIDENT, STAFF, or ADMIN can insert/update dues_config, settlements, and expenses
-- Assuming role check in profiles table
create policy "Privileged roles can manage dues config" on public.dues_config for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('PRESIDENT', 'STAFF', 'ADMIN')));

create policy "Privileged roles can manage settlements" on public.settlements for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('PRESIDENT', 'STAFF', 'ADMIN')));

create policy "Users can insert their own pending transfer" on public.settlements for insert
  with check (auth.uid() = user_id);

create policy "Privileged roles can manage expenses" on public.expenses for all 
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('PRESIDENT', 'STAFF', 'ADMIN')));

-- President can update roles (appoint staff)
create policy "President can update roles" on public.profiles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'PRESIDENT'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'PRESIDENT'));

-- Set initial president (This needs to be run manually in Supabase SQL editor or via service role)
-- update public.profiles set role = 'PRESIDENT' where email = 'ssochul@naver.com';
