import type { Currency, RateType } from '../db/types'

export interface RateInfo {
  value: number
  date: string
  source: string
}

/**
 * Respaldo honesto: las últimas tasas verificadas contra DolarAPI.
 * La app las reemplaza con la tabla `rates` en cuanto hay conexión.
 */
export const FALLBACK_RATES: Record<RateType, RateInfo> = {
  bcv: { value: 888.1183, date: '2026-10-28', source: 'BCV · respaldo local' },
  paralelo: {
    value: 1004.007569,
    date: '2026-10-28',
    source: 'DolarAPI · respaldo local',
  },
}

export const RATE_LABEL: Record<RateType, string> = {
  bcv: 'BCV',
  paralelo: 'Paralelo',
}

let cached: Record<RateType, RateInfo> = { ...FALLBACK_RATES }

export function getRates(): Record<RateType, RateInfo> {
  return cached
}

export function setCachedRates(next: Partial<Record<RateType, RateInfo>>) {
  cached = { ...cached, ...next }
}

export function rateInfo(type: RateType): RateInfo {
  return cached[type]
}

export function rateValue(type: RateType) {
  return cached[type].value
}

export function toUsd(amount: number, currency: Currency, rate: number) {
  return currency === 'USD' ? amount : amount / rate
}

export function toBs(amount: number, currency: Currency, rate: number) {
  return currency === 'USD' ? amount * rate : amount
}

export function equivalent(
  usd: number,
  currency: Currency,
  rate: number,
) {
  return currency === 'USD' ? usd : usd * rate
}
