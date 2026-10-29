-- Telegram: códigos de vinculación de un solo uso y deduplicación de updates.
-- El bot escribe con service_role; el cliente solo pide su código y revoca su vínculo.

create table public.telegram_link_codes (
  code text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

create index telegram_link_codes_user_idx
  on public.telegram_link_codes (user_id, expires_at desc);

alter table public.telegram_link_codes enable row level security;
revoke all on public.telegram_link_codes from anon, authenticated;

alter table public.transactions
  add column if not exists telegram_update_id bigint;

create unique index if not exists transactions_telegram_update_idx
  on public.transactions (telegram_update_id)
  where telegram_update_id is not null;

create or replace function public.create_telegram_link_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_try integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;

  delete from public.telegram_link_codes
   where user_id = auth.uid()
     and (used_at is not null or expires_at < now());

  loop
    v_try := v_try + 1;
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 8));
    begin
      insert into public.telegram_link_codes (code, user_id, expires_at)
      values (v_code, auth.uid(), now() + interval '10 minutes');
      return v_code;
    exception when unique_violation then
      if v_try >= 5 then
        raise;
      end if;
    end;
  end loop;
end;
$$;

revoke all on function public.create_telegram_link_code() from public;
grant execute on function public.create_telegram_link_code() to authenticated;

-- Categoría de respaldo para ingresos que el bot no reconoce.
insert into public.categories (ledger_id, name, icon, kind, position)
select l.id, 'Otros ingresos', 'other', 'income', 4
  from public.ledgers l
 where not exists (
   select 1 from public.categories c
    where c.ledger_id = l.id
      and c.kind = 'income'
      and c.name = 'Otros ingresos'
 );

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
    (v_ledger_id, 'Otros ingresos', 'other', 'income', 4),
    (v_ledger_id, 'Otros', 'other', 'expense', 9);

  return new;
end;
$$;
