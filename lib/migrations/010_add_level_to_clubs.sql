-- Add level column to clubs table if missing
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS level text DEFAULT 'MID';
