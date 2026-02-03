-- Migration: Add Tournaments Table
create table if not exists public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id),
  name text not null,
  description text,
  start_date date default current_date,
  status text default 'UPCOMING', -- 'UPCOMING', 'ONGOING', 'COMPLETED'
  bracket_data jsonb,
  created_at timestamp with time zone default now()
);

-- RLS for tournaments
alter table public.tournaments enable row level security;

-- Everyone in the club can see tournaments
create policy "Tournaments are viewable by everyone" on public.tournaments
  for select using (true);

-- Only PRESIDENT and STAFF of the specific club can manage its tournaments
create policy "Privileged roles can manage tournaments" on public.tournaments
  for all using (
    exists (
      select 1 from public.club_members
      where club_members.club_id = tournaments.club_id
      and club_members.user_id = auth.uid()
      and club_members.role in ('PRESIDENT', 'STAFF')
    )
  );
