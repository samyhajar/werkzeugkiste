-- Migration: Ensure profile creation and RLS for login redirect fix

-- 1. Ensure the handle_new_user function exists and is correct
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Ensure the trigger is present
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 3. Enable RLS on profiles
alter table public.profiles enable row level security;

-- 4. Ensure the correct RLS policy exists
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);

-- 5. Backfill missing profile rows for existing users
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.email),
  coalesce(u.raw_user_meta_data->>'role', 'student')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;