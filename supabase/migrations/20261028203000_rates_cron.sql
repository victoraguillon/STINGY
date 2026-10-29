-- Refresco automático de tasas cada 6 horas.
-- Requiere el secreto en Vault. Insertarlo una vez por proyecto:
--
--   select vault.create_secret('<RATES_REFRESH_SECRET>', 'rates_refresh_secret',
--     'Secreto compartido entre pg_cron y la Edge Function rates-refresh');
--
-- El secreto real no vive en este archivo ni en git.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_rates_refresh()
returns bigint
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  refresh_secret text;
  request_id bigint;
begin
  select decrypted_secret
    into refresh_secret
    from vault.decrypted_secrets
   where name = 'rates_refresh_secret'
   limit 1;

  if refresh_secret is null or refresh_secret = '' then
    raise notice 'rates_refresh_secret no está en Vault; se omite el refresco.';
    return null;
  end if;

  select net.http_post(
    url := 'https://rgihtsveqkeukairrrnz.supabase.co/functions/v1/rates-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-rates-secret', refresh_secret
    ),
    body := '{"reason":"cron"}'::jsonb,
    timeout_milliseconds := 15000
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.trigger_rates_refresh() from public;
revoke all on function public.trigger_rates_refresh() from anon, authenticated;

select cron.unschedule('rates-refresh')
where exists (select 1 from cron.job where jobname = 'rates-refresh');

select cron.schedule(
  'rates-refresh',
  '17 */6 * * *',
  $$select public.trigger_rates_refresh();$$
);
