-- Add invite_code to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS invite_code text;

-- Generate random implementation for existing/new rows 
-- (Simple random string generation function)
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS text AS $$
DECLARE
    chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
    result text := '';
    i integer := 0;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || chars[1+random()*(array_length(chars, 1)-1)];
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing clubs with code
UPDATE public.clubs 
SET invite_code = generate_invite_code() 
WHERE invite_code IS NULL;

-- Automatically generate code for new clubs
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code := generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_invite_code ON public.clubs;
CREATE TRIGGER trigger_set_invite_code
BEFORE INSERT ON public.clubs
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();

-- Create RLS Policy for Profiles update (Join Club)
-- Users can update their own profile's club_id
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);
