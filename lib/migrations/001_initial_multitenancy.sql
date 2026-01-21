-- Phase 1 Migration: Multi-tenancy Architecture (Idempotent Version)

-- 1. Create CLUBS table (Safe check)
create table if not exists public.clubs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique, -- for url friendly access like /clubs/mumeong
  description text,
  logo_url text,
  region text,
  is_public boolean default true,
  status text default 'ACTIVE', -- 'PENDING', 'ACTIVE', 'REJECTED'
  created_at timestamp with time zone default now()
);

-- Ensure owner_id column exists (It was missing in previous version)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'owner_id') THEN
        ALTER TABLE public.clubs ADD COLUMN owner_id uuid references public.profiles(id);
    END IF;
END $$;

-- RLS for clubs
alter table public.clubs enable row level security;

-- Policies (Drop and Recreate to allow re-running)
drop policy if exists "Active clubs are viewable by everyone" on public.clubs;
create policy "Active clubs are viewable by everyone" on public.clubs for select using (status = 'ACTIVE');

drop policy if exists "Authenticated users can create clubs" on public.clubs;
create policy "Authenticated users can create clubs" on public.clubs for insert with check (auth.role() = 'authenticated');

drop policy if exists "Owners can view pending clubs" on public.clubs;
create policy "Owners can view pending clubs" on public.clubs for select using (auth.uid() = owner_id);

drop policy if exists "Super admin full access" on public.clubs;
-- Assuming super admin can bypass RLS or needs specific policy. For now we can assume service role usage or add specific policy if needed.
-- But for client side super admin page:
create policy "Super admin full access" on public.clubs for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'PRESIDENT' 
    -- Note: Ideally we should use a stronger check or a separate admin role, but this matches AuthContext logic
  )
);

-- 2. Insert the Default Club (Current "Anonymous Club")
DO $$
DECLARE
  default_club_id uuid;
BEGIN
  -- Insert default club if not exists
  INSERT INTO public.clubs (name, slug, description, region, status)
  VALUES ('무명 클럽', 'anonymous', 'MatchUp Pro Default Club', 'SEOUL', 'ACTIVE')
  ON CONFLICT (slug) DO NOTHING;

  -- Get the ID
  SELECT id INTO default_club_id FROM public.clubs WHERE slug = 'anonymous'; 

  -- 3. Add club_id to existing tables and Migrate Data
  
  -- PROFILES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'club_id') THEN
      ALTER TABLE public.profiles ADD COLUMN club_id uuid references public.clubs(id);
      UPDATE public.profiles SET club_id = default_club_id WHERE club_id IS NULL;
      CREATE INDEX idx_profiles_club_id ON public.profiles(club_id);
  END IF;

  -- SEASONS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seasons' AND column_name = 'club_id') THEN
      ALTER TABLE public.seasons ADD COLUMN club_id uuid references public.clubs(id);
      UPDATE public.seasons SET club_id = default_club_id WHERE club_id IS NULL;
  END IF;

  -- SETTLEMENTS
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settlements' AND column_name = 'club_id') THEN
      ALTER TABLE public.settlements ADD COLUMN club_id uuid references public.clubs(id);
      UPDATE public.settlements SET club_id = default_club_id WHERE club_id IS NULL;
  END IF;
  
  -- DUES_CONFIG
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dues_config' AND column_name = 'club_id') THEN
      ALTER TABLE public.dues_config ADD COLUMN club_id uuid references public.clubs(id);
      UPDATE public.dues_config SET club_id = default_club_id WHERE club_id IS NULL;
  END IF;
  
  -- EXPENSES
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'club_id') THEN
      ALTER TABLE public.expenses ADD COLUMN club_id uuid references public.clubs(id);
      UPDATE public.expenses SET club_id = default_club_id WHERE club_id IS NULL;
  END IF;
  
   -- ATTENDANCE
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'club_id') THEN
      ALTER TABLE public.attendance ADD COLUMN club_id uuid references public.clubs(id);
      UPDATE public.attendance SET club_id = default_club_id WHERE club_id IS NULL;
      -- Drop old unique constraint and add new one including club_id
      ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_user_id_target_date_key; 
      ALTER TABLE public.attendance ADD CONSTRAINT attendance_user_id_club_date_key UNIQUE (user_id, club_id, target_date);
  END IF;

END $$;
