-- Stingy — esquema inicial, RLS y onboarding.
-- Una cuenta por persona; ledgers y members ya preparados para libros compartidos.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.ledgers (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Personal',
  kind text not null default 'personal' check (kind in ('personal', 'shared')),
  base_currency text not null default 'VES' check (base_currency in ('VES', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  default_ledger_id uuid references public.ledgers (id) on delete set null,
  base_currency text not null default 'VES' check (base_currency in ('VES', 'USD')),
  default_rate_type text not null default 'bcv' check (default_rate_type in ('bcv', 'paralelo')),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ledger_members (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (ledger_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  name text not null,
  icon text not null default 'other'
    check (icon in ('food', 'transport', 'home', 'services', 'health', 'fun',
                    'shopping', 'pets', 'salary', 'freelance', 'sales', 'other')),
  kind text not null check (kind in ('expense', 'income')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('expense', 'income')),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null check (currency in ('VES', 'USD')),
  rate_type text not null check (rate_type in ('bcv', 'paralelo')),
  rate numeric(18, 6) not null check (rate > 0),
  amount_usd numeric(14, 2) not null default 0,
  category_id uuid references public.categories (id) on delete set null,
  note text not null default '',
  occurred_on date not null default current_date,
  source text not null default 'web' check (source in ('web', 'telegram')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.rates (
  type text primary key check (type in ('bcv', 'paralelo')),
  value numeric(18, 6) not null check (value > 0),
  source text not null,
  fetched_at timestamptz not null default now()
);

-- Preparado para la Fase 5. Sin escritura desde el cliente.
create table public.telegram_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  chat_id bigint unique,
  username text,
  linked_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index categories_ledger_idx on public.categories (ledger_id, kind, position);
create index transactions_ledger_date_idx on public.transactions (ledger_id, occurred_on desc);
create index transactions_ledger_updated_idx on public.transactions (ledger_id, updated_at);
create index ledger_members_user_idx on public.ledger_members (user_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger ledgers_set_updated_at
  before update on public.ledgers
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Membresía y RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_ledger_member(p_ledger_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ledger_members m
    where m.ledger_id = p_ledger_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_ledger_owner(p_ledger_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ledger_members m
    where m.ledger_id = p_ledger_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

revoke all on function public.is_ledger_member(uuid) from public;
revoke all on function public.is_ledger_owner(uuid) from public;
grant execute on function public.is_ledger_member(uuid) to authenticated;
grant execute on function public.is_ledger_owner(uuid) to authenticated;

alter table public.ledgers enable row level security;
alter table public.profiles enable row level security;
alter table public.ledger_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.rates enable row level security;
alter table public.telegram_links enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ledgers
create policy "ledgers_select_member" on public.ledgers
  for select to authenticated
  using (public.is_ledger_member(id));

create policy "ledgers_update_owner" on public.ledgers
  for update to authenticated
  using (public.is_ledger_owner(id))
  with check (public.is_ledger_owner(id));

-- ledger_members
create policy "members_select_member" on public.ledger_members
  for select to authenticated
  using (public.is_ledger_member(ledger_id));

create policy "members_insert_owner" on public.ledger_members
  for insert to authenticated
  with check (public.is_ledger_owner(ledger_id));

create policy "members_update_owner" on public.ledger_members
  for update to authenticated
  using (public.is_ledger_owner(ledger_id))
  with check (public.is_ledger_owner(ledger_id));

create policy "members_delete_owner" on public.ledger_members
  for delete to authenticated
  using (public.is_ledger_owner(ledger_id));

-- categories
create policy "categories_select_member" on public.categories
  for select to authenticated
  using (public.is_ledger_member(ledger_id));

create policy "categories_insert_member" on public.categories
  for insert to authenticated
  with check (public.is_ledger_member(ledger_id));

create policy "categories_update_member" on public.categories
  for update to authenticated
  using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_member(ledger_id));

create policy "categories_delete_member" on public.categories
  for delete to authenticated
  using (public.is_ledger_member(ledger_id));

-- transactions
create policy "transactions_select_member" on public.transactions
  for select to authenticated
  using (public.is_ledger_member(ledger_id));

create policy "transactions_insert_member" on public.transactions
  for insert to authenticated
  with check (public.is_ledger_member(ledger_id) and created_by = auth.uid());

create policy "transactions_update_member" on public.transactions
  for update to authenticated
  using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_member(ledger_id));

create policy "transactions_delete_member" on public.transactions
  for delete to authenticated
  using (public.is_ledger_member(ledger_id));

-- rates: lectura pública, escritura solo service_role / Edge Function
create policy "rates_select_public" on public.rates
  for select to anon, authenticated
  using (true);

-- telegram_links: el usuario ve y revoca su vínculo; el bot escribe con service_role
create policy "telegram_select_own" on public.telegram_links
  for select to authenticated
  using (user_id = auth.uid());

create policy "telegram_update_own" on public.telegram_links
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "telegram_delete_own" on public.telegram_links
  for delete to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants explícitos
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.rates to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.ledgers to authenticated;
grant select, insert, update, delete on public.ledger_members to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, update, delete on public.telegram_links to authenticated;

-- ---------------------------------------------------------------------------
-- Alta de usuario: perfil, libro personal, membresía y categorías
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ledger_id uuid := gen_random_uuid();
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Sin nombre'
  );

  insert into public.ledgers (id, name, kind, base_currency)
  values (v_ledger_id, 'Personal', 'personal', 'VES');

  insert into public.profiles (id, email, name, default_ledger_id)
  values (new.id, coalesce(new.email, ''), v_name, v_ledger_id);

  insert into public.ledger_members (ledger_id, user_id, role)
  values (v_ledger_id, new.id, 'owner');

  insert into public.categories (ledger_id, name, icon, kind, position)
  values
    (v_ledger_id, 'Comida', 'food', 'expense', 1),
    (v_ledger_id, 'Transporte', 'transport', 'expense', 2),
    (v_ledger_id, 'Hogar', 'home', 'expense', 3),
    (v_ledger_id, 'Servicios', 'services', 'expense', 4),
    (v_ledger_id, 'Salud', 'health', 'expense', 5),
    (v_ledger_id, 'Ocio', 'fun', 'expense', 6),
    (v_ledger_id, 'Compras', 'shopping', 'expense', 7),
    (v_ledger_id, 'Mascotas', 'pets', 'expense', 8),
    (v_ledger_id, 'Sueldo', 'salary', 'income', 1),
    (v_ledger_id, 'Freelance', 'freelance', 'income', 2),
    (v_ledger_id, 'Ventas', 'sales', 'income', 3),
    (v_ledger_id, 'Otros', 'other', 'expense', 9);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC de onboarding y borrado de cuenta
-- ---------------------------------------------------------------------------

create or replace function public.complete_onboarding(
  p_name text,
  p_base_currency text,
  p_default_rate_type text
)
returns public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'name_too_short' using errcode = '22023';
  end if;
  if p_base_currency not in ('VES', 'USD') then
    raise exception 'invalid_currency' using errcode = '22023';
  end if;
  if p_default_rate_type not in ('bcv', 'paralelo') then
    raise exception 'invalid_rate_type' using errcode = '22023';
  end if;

  update public.profiles
     set name = trim(p_name),
         base_currency = p_base_currency,
         default_rate_type = p_default_rate_type,
         onboarding_complete = true
   where id = auth.uid()
  returning * into v_profile;

  if v_profile.id is null then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  return v_profile;
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.complete_onboarding(text, text, text) from public;
revoke all on function public.delete_own_account() from public;
grant execute on function public.complete_onboarding(text, text, text) to authenticated;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Tasas de arranque (DolarAPI verificado el 28-oct-2026)
-- ---------------------------------------------------------------------------

insert into public.rates (type, value, source, fetched_at)
values
  ('bcv', 888.118300, 'BCV', '2026-10-28T12:00:00Z'),
  ('paralelo', 1004.007569, 'DolarAPI · paralelo', '2026-10-28T12:00:00Z')
on conflict (type) do nothing;
