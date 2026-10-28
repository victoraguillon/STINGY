import type { Currency, RateType } from '../db/types'

export interface RateInfo {
  value: number
  date: string
  source: string
}

export const RATES: Record<RateType, RateInfo> = {
  bcv: { value: 886.2271, date: '2026-10-23', source: 'BCV' },
  paralelo: { value: 1003.61365, date: '2026-10-26', source: 'Referencia de mercado' },
}

export const RATE_LABEL: Record<RateType, string> = {
  bcv: 'BCV',
  paralelo: 'Paralelo',
}

export function rateValue(type: RateType) {
  return RATES[type].value
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
