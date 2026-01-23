-- Fix Unique Index for Attendance Upsert
-- The error "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- means we are trying to use ON CONFLICT (user_id, target_date, club_id) 
-- but Postgres doesn't see a corresponding UNIQUE CONSTRAINT.
-- A UNIQUE INDEX is not enough for ON CONFLICT unless it is promoted to a CONSTRAINT 
-- or we specify the index name in some SQL dialects, but standard ON CONFLICT usually looks for constraints.
-- Actually, ON CONFLICT (cols) DO UPDATE works if there is a unique index on (cols).
-- However, if any column is NULL, unique index allows duplicates (unless NULLS NOT DISTINCT).
-- If 'club_id' is nullable, that might be an issue if we pass null. But we pass club_id.

-- Let's make sure the unique index exists and strictly enforces uniqueness.

DROP INDEX IF EXISTS attendance_user_date_club_unique;

-- Create it again carefully.
CREATE UNIQUE INDEX attendance_user_date_club_unique 
ON public.attendance (user_id, target_date, club_id);

-- Also, to be safe for ON CONFLICT, usually adding a constraint is clearer.
ALTER TABLE public.attendance
DROP CONSTRAINT IF EXISTS attendance_user_date_club_constraint;

ALTER TABLE public.attendance
ADD CONSTRAINT attendance_user_date_club_constraint UNIQUE USING INDEX attendance_user_date_club_unique;
