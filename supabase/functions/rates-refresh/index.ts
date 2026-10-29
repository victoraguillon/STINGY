// Refresca las tasas BCV y paralelo desde DolarAPI.
// La invoca el cliente (botón "Actualizar") y el cron de pg_cron cada 6 horas.
// Desplegar con: supabase functions deploy rates-refresh

import { createClient } from 'npm:@supabase/supabase-js@2'

const DOLARAPI_URL = 'https://ve.dolarapi.com/v1/dolares'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-rates-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DolarApiRate {
  moneda?: string
  fuente?: string
  nombre?: string
  compra?: number | null
  venta?: number | null
  promedio?: number | null
  fechaActualizacion?: string
}

interface ParsedRate {
  type: 'bcv' | 'paralelo'
  value: number
  source: string
  fetchedAt: string
}

const SOURCE_BY_TYPE = {
  bcv: 'BCV',
  paralelo: 'DolarAPI · paralelo',
} as const

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function parseRates(payload: DolarApiRate[]): ParsedRate[] {
  const parsed: ParsedRate[] = []
  for (const item of payload) {
    const type =
      item.fuente === 'oficial'
        ? ('bcv' as const)
        : item.fuente === 'paralelo'
          ? ('paralelo' as const)
          : null
    if (!type) continue

    const value = item.promedio ?? item.venta ?? item.compra
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue

    const rawDate = item.fechaActualizacion
    const date = rawDate ? new Date(rawDate) : new Date()
    const fetchedAt = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()

    parsed.push({
      type,
      value: Math.round(value * 1e6) / 1e6,
      source: SOURCE_BY_TYPE[type],
      fetchedAt,
    })
  }
  return parsed
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405)

  const secret = Deno.env.get('RATES_REFRESH_SECRET')
  const provided = request.headers.get('x-rates-secret')
  const authorized = secret ? provided === secret : false
  const fromBrowser = Boolean(request.headers.get('authorization'))

  if (secret && !authorized && !fromBrowser) {
    return json({ ok: false, error: 'No autorizado.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRole) {
    return json({ ok: false, error: 'Faltan variables de Supabase.' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Evita martillar DolarAPI con invocaciones anónimas repetidas.
  if (!authorized) {
    const { data: latest } = await supabase
      .from('rates')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latest?.fetched_at) {
      const age = Date.now() - new Date(latest.fetched_at).getTime()
      if (age >= 0 && age < 5 * 60 * 1000) {
        return json({ ok: true, skipped: true, reason: 'Tasas recientes.' })
      }
    }
  }

  let payload: DolarApiRate[]
  try {
    const response = await fetch(DOLARAPI_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    })
    if (!response.ok) {
      return json({ ok: false, error: `DolarAPI respondió ${response.status}.` }, 502)
    }
    payload = (await response.json()) as DolarApiRate[]
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : 'DolarAPI no respondió.' },
      502,
    )
  }

  const rates = parseRates(Array.isArray(payload) ? payload : [])
  if (rates.length === 0) {
    return json({ ok: false, error: 'DolarAPI no devolvió tasas válidas.' }, 502)
  }

  const { error } = await supabase.from('rates').upsert(
    rates.map((rate) => ({
      type: rate.type,
      value: rate.value,
      source: rate.source,
      fetched_at: rate.fetchedAt,
    })),
    { onConflict: 'type' },
  )

  if (error) {
    return json({ ok: false, error: error.message }, 500)
  }

  return json({
    ok: true,
    updated: rates.map((rate) => rate.type),
    rates,
    fetchedAt: new Date().toISOString(),
  })
})
