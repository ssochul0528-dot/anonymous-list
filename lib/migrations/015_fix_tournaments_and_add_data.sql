-- Migration: Update tournaments schema and add national data
-- 1. Rename 'title' to 'name' if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tournaments' AND column_name='title') THEN
    ALTER TABLE public.tournaments RENAME COLUMN title TO name;
  END IF;
END $$;

-- 2. Add 'name' column if missing
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS name text;

-- 3. Add other missing columns
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS organizer text,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS link_url text;

-- 4. Insert national tournament data for 2026
INSERT INTO public.tournaments (name, organizer, start_date, end_date, location, category, link_url, status)
VALUES 
('2026 인천시테니스협회장배 전국 동호인 테니스대회', '인천광역시테니스협회', '2026-02-26', '2026-03-01', '인천 열우물코트', '동호인', 'http://kato.kr', 'UPCOMING'),
('제4회 대전명봉클럽배 전국동호인테니스대회', '대전명봉클럽', '2026-02-27', '2026-03-01', '대전', '동호인', 'http://kato.kr', 'UPCOMING'),
('제5회 낫소 & KSTF 회장배 전국시니어테니스대회', '한국시니어테니스연맹', '2026-02-26', '2026-02-27', '충주 탄금테니스장', '시니어', 'http://ksta.co.kr', 'UPCOMING'),
('2026 김천 KMHTF 오픈 춘계 전국주니어테니스대회', '대한테니스협회', '2026-02-07', '2026-02-14', '김천', '주니어', 'http://kortennis.or.kr', 'ONGOING'),
('제5회 Kim''s 전국동호인테니스대회', 'Kato', '2026-03-07', '2026-03-15', '전국', '동호인', 'http://kato.kr', 'UPCOMING')
ON CONFLICT DO NOTHING;
