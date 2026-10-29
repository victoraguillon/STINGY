-- Corrige el alta de usuario tras añadir ledgers.owner_id.
-- La migración de Telegram redefinió handle_new_user sin owner_id y el alta fallaba.

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

  insert into public.ledgers (id, owner_id, name, kind, base_currency)
  values (v_ledger_id, new.id, 'Personal', 'personal', 'VES');

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
