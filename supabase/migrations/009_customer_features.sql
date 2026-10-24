-- Additive customer features for Mane & Oggarane. No existing table is dropped or rewritten.
create table if not exists public.customer_addresses (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references auth.users(id) on delete cascade,
 label text not null default 'Home' check(length(label) between 1 and 40),
 line1 text not null check(length(line1) between 5 and 240),
 city text not null default 'Bengaluru' check(length(city) between 2 and 100),
 pin_code text not null check(pin_code ~ '^[0-9]{6}$'),
 is_default boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists customer_one_default_address
 on public.customer_addresses(customer_id) where is_default;
create index if not exists customer_addresses_owner_idx on public.customer_addresses(customer_id,created_at);
alter table public.customer_addresses enable row level security;
revoke all on public.customer_addresses from anon;
grant select,insert,update,delete on public.customer_addresses to authenticated;
drop policy if exists "Addresses readable by owner" on public.customer_addresses;
create policy "Addresses readable by owner" on public.customer_addresses for select to authenticated using ((select auth.uid())=customer_id);
drop policy if exists "Addresses created by owner" on public.customer_addresses;
create policy "Addresses created by owner" on public.customer_addresses for insert to authenticated with check ((select auth.uid())=customer_id);
drop policy if exists "Addresses updated by owner" on public.customer_addresses;
create policy "Addresses updated by owner" on public.customer_addresses for update to authenticated using ((select auth.uid())=customer_id) with check ((select auth.uid())=customer_id);
drop policy if exists "Addresses removed by owner" on public.customer_addresses;
create policy "Addresses removed by owner" on public.customer_addresses for delete to authenticated using ((select auth.uid())=customer_id);

create table if not exists public.saved_dishes (
 customer_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null references public.products(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(customer_id,product_id)
);
alter table public.saved_dishes enable row level security;
revoke all on public.saved_dishes from anon;
grant select,insert,delete on public.saved_dishes to authenticated;
drop policy if exists "Saved dishes readable by owner" on public.saved_dishes;
create policy "Saved dishes readable by owner" on public.saved_dishes for select to authenticated using ((select auth.uid())=customer_id);
drop policy if exists "Saved dishes created by owner" on public.saved_dishes;
create policy "Saved dishes created by owner" on public.saved_dishes for insert to authenticated with check ((select auth.uid())=customer_id);
drop policy if exists "Saved dishes deleted by owner" on public.saved_dishes;
create policy "Saved dishes deleted by owner" on public.saved_dishes for delete to authenticated using ((select auth.uid())=customer_id);

create table if not exists public.customer_feedback (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references auth.users(id) on delete cascade,
 rating smallint check(rating between 1 and 5),
 message text not null check(length(message) between 5 and 1200),
 created_at timestamptz not null default now()
);
create index if not exists customer_feedback_owner_idx on public.customer_feedback(customer_id,created_at desc);
alter table public.customer_feedback enable row level security;
revoke all on public.customer_feedback from anon;
grant select,insert on public.customer_feedback to authenticated;
drop policy if exists "Feedback readable by owner" on public.customer_feedback;
create policy "Feedback readable by owner" on public.customer_feedback for select to authenticated using ((select auth.uid())=customer_id);
drop policy if exists "Feedback created by owner" on public.customer_feedback;
create policy "Feedback created by owner" on public.customer_feedback for insert to authenticated with check ((select auth.uid())=customer_id);
