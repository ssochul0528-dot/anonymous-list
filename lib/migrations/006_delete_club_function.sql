-- Function to safely soft-delete a club
-- Sets status to 'DELETED' so it can be hidden/filtered out
CREATE OR REPLACE FUNCTION delete_club(p_club_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Update Club Status to DELETED
  UPDATE public.clubs
  SET status = 'DELETED'
  WHERE id = p_club_id;

  -- 2. Optional: We could kick members out, but for now just marking the club as deleted is safer.
  -- Users will still technically be 'members' of a deleted club until they leave or switch.
  
  RETURN json_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$;
