import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo } from 'react'
import { db } from '../db/db'
import type { RateType } from '../db/types'
import { FALLBACK_RATES, setCachedRates, type RateInfo } from '../lib/fx'

export function useRates(): Record<RateType, RateInfo> {
  const rows = useLiveQuery(() => db.rates.toArray(), [])

  const rates = useMemo(() => {
    const next: Record<RateType, RateInfo> = {
      bcv: FALLBACK_RATES.bcv,
      paralelo: FALLBACK_RATES.paralelo,
    }
    for (const row of rows ?? []) {
      next[row.type] = {
        value: Number(row.value),
        date: row.fetchedAt.slice(0, 10),
        source: row.source,
      }
    }
    return next
  }, [rows])

  useEffect(() => {
    setCachedRates(rates)
  }, [rates])

  return rates
}
