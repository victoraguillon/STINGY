import { db, getMeta, setMeta } from '../db/db'
import type { RateRow, RateType } from '../db/types'
import { FALLBACK_RATES, setCachedRates, type RateInfo } from './fx'
import { supabase, supabaseConfigured } from './supabase'

const LAST_PULL = 'rates:last-pull'
const LAST_REFRESH = 'rates:last-refresh'
const SIX_HOURS = 6 * 60 * 60 * 1000

function toInfo(row: RateRow): RateInfo {
  return {
    value: Number(row.value),
    date: row.fetchedAt.slice(0, 10),
    source: row.source,
  }
}

export async function seedFallbackRates() {
  const count = await db.rates.count()
  if (count > 0) return
  await db.rates.bulkPut([
    {
      type: 'bcv',
      value: FALLBACK_RATES.bcv.value,
      source: FALLBACK_RATES.bcv.source,
      fetchedAt: `${FALLBACK_RATES.bcv.date}T12:00:00.000Z`,
    },
    {
      type: 'paralelo',
      value: FALLBACK_RATES.paralelo.value,
      source: FALLBACK_RATES.paralelo.source,
      fetchedAt: `${FALLBACK_RATES.paralelo.date}T12:00:00.000Z`,
    },
  ])
}

export async function loadCachedRates() {
  const rows = await db.rates.toArray()
  if (rows.length === 0) {
    await seedFallbackRates()
    return
  }
  const next: Partial<Record<RateType, RateInfo>> = {}
  for (const row of rows) next[row.type] = toInfo(row)
  setCachedRates(next)
}

async function pullRates() {
  if (!supabaseConfigured) return false
  const { data, error } = await supabase
    .from('rates')
    .select('type,value,source,fetched_at')
  if (error || !data?.length) return false

  const rows: RateRow[] = data.map((row) => ({
    type: row.type as RateType,
    value: Number(row.value),
    source: String(row.source),
    fetchedAt: String(row.fetched_at),
  }))
  await db.rates.bulkPut(rows)
  const next: Partial<Record<RateType, RateInfo>> = {}
  for (const row of rows) next[row.type] = toInfo(row)
  setCachedRates(next)
  await setMeta(LAST_PULL, new Date().toISOString())
  return true
}

export async function refreshRates(): Promise<boolean> {
  if (!supabaseConfigured) return false
  try {
    const { error } = await supabase.functions.invoke('rates-refresh', {
      body: { reason: 'client' },
    })
    if (error) return pullRates()
    await setMeta(LAST_REFRESH, new Date().toISOString())
    return pullRates()
  } catch {
    return pullRates()
  }
}

export async function ensureRates() {
  await loadCachedRates()
  if (!supabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return
  }

  const lastPull = await getMeta(LAST_PULL)
  const fresh = lastPull && Date.now() - new Date(lastPull).getTime() < SIX_HOURS
  if (fresh) return

  const pulled = await pullRates()
  if (!pulled) await refreshRates()
}
