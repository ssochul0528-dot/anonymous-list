-- Add attendance_options to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS attendance_options jsonb DEFAULT '["08:00", "09:00"]'::jsonb;
