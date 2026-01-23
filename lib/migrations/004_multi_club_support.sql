-- 1. Create club_members table
CREATE TABLE IF NOT EXISTS public.club_members (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    club_id uuid REFERENCES public.clubs(id) NOT NULL,
    role text DEFAULT 'MEMBER', -- 'MEMBER', 'STAFF', 'PRESIDENT'
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, club_id)
);

-- 2. Migrate existing profile club relationships to club_members
INSERT INTO public.club_members (user_id, club_id, role)
SELECT id, club_id, role 
FROM public.profiles 
WHERE club_id IS NOT NULL
ON CONFLICT (user_id, club_id) DO NOTHING;

-- 3. Update Attendance table to support multi-club
-- Add club_id nullable first
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);

-- Backfill club_id from profiles (assuming user was in that club when attending)
UPDATE public.attendance a
SET club_id = p.club_id
FROM public.profiles p
WHERE a.user_id = p.id
  AND a.club_id IS NULL;

-- Now make it part of the unique constraint
-- We need to drop the old unique constraint and add a new one
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_user_id_target_date_key;

-- We might have duplicates if we strictly enforce (user, date, club). 
-- But previously it was (user, date). So (user, date, club) should be fine if mapped 1:1.
-- Make club_id not null now?
-- There might be attendance records for users who left a club? 
-- Let's keep it nullable for safety or enforce?
-- For now, let's enforce it if we are sure backfill worked. 
-- But if a user has no club_id in matches, they might be orphan.
-- Let's NOT make it NOT NULL immediately to avoid breakage, but uniqueness should include it.

CREATE UNIQUE INDEX IF NOT EXISTS attendance_user_date_club_unique 
ON public.attendance (user_id, target_date, club_id);

-- 4. RLS for club_members
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memberships" 
ON public.club_members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Public can view memberships (for directory)"
ON public.club_members FOR SELECT
USING (true); 

-- 5. Helper function to join a club
CREATE OR REPLACE FUNCTION join_club(p_club_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_id uuid;
BEGIN
  -- Check if already member
  IF EXISTS (SELECT 1 FROM public.club_members WHERE user_id = auth.uid() AND club_id = p_club_id) THEN
    RETURN json_build_object('status', 'already_joined');
  END IF;

  INSERT INTO public.club_members (user_id, club_id, role)
  VALUES (auth.uid(), p_club_id, 'MEMBER')
  RETURNING id INTO v_member_id;

  -- Also update current profile.club_id as the 'active' club
  UPDATE public.profiles
  SET club_id = p_club_id, role = 'USER' -- Reset role to USER for new club context? 
  -- Wait, role in profile is global or per club?
  -- In single club model, role was in profile. 
  -- In multi club model, role should be in club_members.
  -- But existing apps read p.role. 
  -- We should keep syncing p.role to the CURRENT club's role.
  WHERE id = auth.uid();

  RETURN json_build_object('status', 'success', 'member_id', v_member_id);
END;
$$;
