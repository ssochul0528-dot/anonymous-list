-- Function to handle club approval with elevated privileges
-- This function is SECURITY DEFINER, meaning it runs with the privileges of the creator (postgres), bypassing RLS.

CREATE OR REPLACE FUNCTION approve_club_application(p_club_id uuid, p_owner_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_club_exists boolean;
BEGIN
  -- 1. Check if club exists and is pending (optional safety check)
  SELECT EXISTS (
    SELECT 1 FROM public.clubs 
    WHERE id = p_club_id AND status = 'PENDING'
  ) INTO v_club_exists;

  -- 2. Update Club Status
  UPDATE public.clubs
  SET status = 'ACTIVE'
  WHERE id = p_club_id;

  -- 3. Update Owner Profile
  -- Note: We update the profile to reflect the new club context immediately
  UPDATE public.profiles
  SET 
    role = 'PRESIDENT',
    club_id = p_club_id
  WHERE id = p_owner_id;

  -- 4. Add to club_members
  INSERT INTO public.club_members (user_id, club_id, role)
  VALUES (p_owner_id, p_club_id, 'PRESIDENT')
  ON CONFLICT (user_id, club_id) 
  DO UPDATE SET role = 'PRESIDENT'; -- If they were somehow already a member

  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
