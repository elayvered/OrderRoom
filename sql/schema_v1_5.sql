-- Order Room v1.5 schema & RLS
create extension if not exists pgcrypto;

create table if not exists public.allowed_users (
  email text primary key,
  created_at timestamptz default now()
);
alter table public.allowed_users enable row level security;
create policy "allowed_users read for authed"
  on public.allowed_users for select to authenticated using (true);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  address text
);
alter table public.branches enable row level security;
create policy "branches org users"
  on public.branches for all to authenticated
  using (exists(select 1 from public.allowed_users u where u.email = auth.email()))
  with check (exists(select 1 from public.allowed_users u where u.email = auth.email()));

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text
);
alter table public.suppliers enable row level security;
create policy "suppliers org users"
  on public.suppliers for all to authenticated
  using (exists(select 1 from public.allowed_users u where u.email = auth.email()))
  with check (exists(select 1 from public.allowed_users u where u.email = auth.email()));

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete cascade,
  name text not null,
  unit text,
  price numeric,
  sort_order int,
  active boolean default true
);
alter table public.items enable row level security;
create policy "items org users"
  on public.items for all to authenticated
  using (exists(select 1 from public.allowed_users u where u.email = auth.email()))
  with check (exists(select 1 from public.allowed_users u where u.email = auth.email()));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  notes text,
  created_by uuid default auth.uid()
);
alter table public.orders enable row level security;
create policy "orders org users"
  on public.orders for all to authenticated
  using (exists(select 1 from public.allowed_users u where u.email = auth.email()))
  with check (exists(select 1 from public.allowed_users u where u.email = auth.email()));

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  quantity numeric,
  unit_price numeric,
  name_snapshot text,
  unit_snapshot text
);
alter table public.order_items enable row level security;
create policy "order_items org users"
  on public.order_items for all to authenticated
  using (exists(select 1 from public.allowed_users u where u.email = auth.email()))
  with check (exists(select 1 from public.allowed_users u where u.email = auth.email()));

create or replace function public.order_items_monthly(p_start timestamptz, p_end timestamptz)
returns table(item_name text, total_qty numeric)
language sql security definer set search_path = public as $$
  select coalesce(oi.name_snapshot, i.name) as item_name,
         sum(oi.quantity) as total_qty
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.items i on i.id = oi.item_id
  where o.created_at >= p_start and o.created_at < p_end
  group by 1 order by 1;
$$;

insert into public.branches (code, name, address) values
  ('הילס','הילס','אריק איינשטיין 3, הרצליה')
on conflict (code) do nothing;

insert into public.branches (code, name, address) values
  ('נורדאו','נורדאו','נורדאו 4, הרצליה')
on conflict (code) do nothing;

insert into public.suppliers (name, contact_name, phone, email) values
  (E'מזרח מערב','יובל','+9725044320036',null),
  (E'דיפלומט',null,null,null)
on conflict do nothing;

with mm as (select id from public.suppliers where name = E'מזרח מערב' limit 1)
insert into public.items (supplier_id, name, unit, sort_order) values
  ((select id from mm), E'אבקת וואסבי','יחידה',10),
  ((select id from mm), E'א. ביצים לאיון','קופסה',20),
  ((select id from mm), E'אטריות אורז 3 מ"מ','חבילה',30),
  ((select id from mm), E'ג\'ינג\'ר לבן','ק"ג',40),
  ((select id from mm), E'מגש 03','יחידה',50),
  ((select id from mm), E'מגש 07','יחידה',60)
on conflict do nothing;
