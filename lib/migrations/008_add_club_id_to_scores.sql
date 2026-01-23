-- Add club_id column to scores table
ALTER TABLE public.scores 
ADD COLUMN IF NOT EXISTS club_id uuid REFERENCES public.clubs(id);

-- Backfill club_id from profiles (assuming the user belonged to the club stored in their profile at the time)
-- Note: This is a best-effort backfill.
UPDATE public.scores s
SET club_id = p.club_id
FROM public.profiles p
WHERE s.user_id = p.id
  AND s.club_id IS NULL;

-- Enable RLS if not already
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see scores from their clubs
CREATE POLICY "Users can view scores from their clubs"
ON public.scores FOR SELECT
USING (
  club_id IN (
    SELECT club_id FROM public.club_members WHERE user_id = auth.uid()
  )
);

-- Policy: Staff can insert/update/delete scores for their club
CREATE POLICY "Staff can manage scores for their club"
ON public.scores FOR ALL
USING (
  club_id IN (
    SELECT club_id FROM public.club_members 
    WHERE user_id = auth.uid() AND role IN ('STAFF', 'PRESIDENT')
  )
);
