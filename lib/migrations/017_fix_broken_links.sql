-- Fix broken links for tournaments
UPDATE public.tournaments SET link_url = 'http://www.kortennis.co.kr' WHERE organizer = '대한테니스협회';
UPDATE public.tournaments SET link_url = 'http://www.kato.kr' WHERE organizer = 'Kato';
UPDATE public.tournaments SET link_url = 'http://www.ksta.co.kr' WHERE organizer = '한국시니어테니스연맹';
