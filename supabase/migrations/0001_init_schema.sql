-- Supabase schema + policies for BDA Cali app
create extension if not exists "pgcrypto";
create extension if not exists "citext";

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'user_role'
    ) then
        create type public.user_role as enum ('admin', 'warehouse', 'driver');
    end if;
end;
$$;

do $$
begin
    if not exists (
        select 1
        from pg_type
        where typname = 'donation_stage'
    ) then
        create type public.donation_stage as enum (
            'pending',
            'accepted',
            'pickedup',
            'completed'
        );
    end if;
end;
$$;

create table if not exists public.staff_profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email citext unique not null,
    role public.user_role not null,
    name jsonb not null check (name ? 'first' and name ? 'last1'),
    plate text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.donations (
    id uuid primary key default gen_random_uuid(),
    legacy_id text unique,
    status public.donation_stage not null default 'pending',
    client jsonb not null,
    org jsonb,
    indiv jsonb,
    donation jsonb not null,
    pickup jsonb,
    pickup_driver uuid references public.staff_profiles (id),
    pickup_driver_name text,
    pickup_driver_plate text,
    pickup_date timestamptz,
    tax_deduction boolean,
    created_by uuid references public.staff_profiles (id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists donations_status_created_at_idx
    on public.donations (status, created_at desc);
create index if not exists donations_status_pickup_date_idx
    on public.donations (status, pickup_date);
create index if not exists donations_status_pickup_driver_idx
    on public.donations (status, pickup_driver);

create or replace view public.pending as
select *
from public.donations
where status = 'pending';

create or replace view public.accepted as
select *
from public.donations
where status = 'accepted';

create or replace view public.pickedup as
select *
from public.donations
where status = 'pickedup';

create or replace view public.completed as
select *
from public.donations
where status = 'completed';

alter table public.staff_profiles enable row level security;
alter table public.donations enable row level security;

drop policy if exists "self view profile" on public.staff_profiles;
create policy "self view profile"
    on public.staff_profiles
    for select
    using (auth.uid() = id);

drop policy if exists "self manage profile" on public.staff_profiles;
create policy "self manage profile"
    on public.staff_profiles
    for all
    using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists "admin manage profiles" on public.staff_profiles;
create policy "admin manage profiles"
    on public.staff_profiles
    for all
    using (
        exists (
            select 1
            from public.staff_profiles me
            where me.id = auth.uid()
              and me.role in ('admin', 'warehouse')
        )
    )
    with check (
        exists (
            select 1
            from public.staff_profiles me
            where me.id = auth.uid()
              and me.role in ('admin', 'warehouse')
        )
    );

drop policy if exists "admin manage donations" on public.donations;
create policy "admin manage donations"
    on public.donations
    for all
    using (
        exists (
            select 1
            from public.staff_profiles me
            where me.id = auth.uid()
              and me.role in ('admin', 'warehouse')
        )
    )
    with check (
        exists (
            select 1
            from public.staff_profiles me
            where me.id = auth.uid()
              and me.role in ('admin', 'warehouse')
        )
    );

drop policy if exists "drivers read assigned donations" on public.donations;
create policy "drivers read assigned donations"
    on public.donations
    for select
    using (
        status in ('accepted', 'pickedup')
        and pickup_driver = auth.uid()
    );

drop policy if exists "drivers update assigned donations" on public.donations;
create policy "drivers update assigned donations"
    on public.donations
    for update
    using (
        status in ('accepted', 'pickedup')
        and pickup_driver = auth.uid()
    )
    with check (
        status in ('accepted', 'pickedup')
        and pickup_driver = auth.uid()
    );
