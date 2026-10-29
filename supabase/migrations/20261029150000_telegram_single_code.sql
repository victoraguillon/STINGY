-- Un solo código activo por cuenta: generar uno nuevo invalida el anterior.

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

  delete from public.telegram_link_codes where user_id = auth.uid();

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
