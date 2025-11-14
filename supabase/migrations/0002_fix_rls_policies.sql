-- Fix infinite recursion in RLS policies by creating a helper function
-- that bypasses RLS to check user roles

-- Create a security definer function to get user role without triggering RLS
create or replace function public.get_my_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.staff_profiles where id = auth.uid();
$$;

-- Drop existing policies
drop policy if exists "self view profile" on public.staff_profiles;
drop policy if exists "self manage profile" on public.staff_profiles;
drop policy if exists "admin manage profiles" on public.staff_profiles;

-- Recreate policies using the helper function to avoid recursion
create policy "self view profile"
    on public.staff_profiles
    for select
    using (auth.uid() = id);

create policy "self manage profile"
    on public.staff_profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "admin manage profiles"
    on public.staff_profiles
    for all
    using (public.get_my_role() in ('admin', 'warehouse'))
    with check (public.get_my_role() in ('admin', 'warehouse'));

-- Update donation policies to use the helper function as well
drop policy if exists "admin manage donations" on public.donations;
create policy "admin manage donations"
    on public.donations
    for all
    using (public.get_my_role() in ('admin', 'warehouse'))
    with check (public.get_my_role() in ('admin', 'warehouse'));
