-- Migration: Enable public read access for tournaments
-- This ensures national tournaments are visible to everyone

-- Enable Row Level Security
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists and create a new one
DROP POLICY IF EXISTS "Allow public read access for tournaments" ON public.tournaments;

CREATE POLICY "Allow public read access for tournaments" 
ON public.tournaments 
FOR SELECT 
TO public 
USING (true);
