-- Migration: Add customizable game day and attendance window to clubs
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS game_day integer DEFAULT 3; -- 0: Sun, 1: Mon, ..., 3: Wed, 6: Sat

-- Update existing clubs to default to Wednesday
UPDATE public.clubs SET game_day = 3 WHERE game_day IS NULL;
