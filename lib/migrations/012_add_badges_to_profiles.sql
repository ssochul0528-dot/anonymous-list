-- Add badges column to profiles table if it doesn't exist
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='badges') then
    alter table public.profiles add column badges text[] default '{}';
  end if;
end $$;
