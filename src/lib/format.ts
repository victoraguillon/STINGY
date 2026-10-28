import type { Currency, TxKind } from '../db/types'

const money = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const rateFormat = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const whole = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 0,
})

const compact = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 1,
})

export function formatNumber(value: number) {
  return money.format(value)
}

export function formatRate(value: number) {
  return rateFormat.format(value)
}

export function currencyPrefix(currency: Currency) {
  return currency === 'VES' ? 'Bs' : '$'
}

export function formatMoney(value: number, currency: Currency) {
  const sign = value < 0 ? '−' : ''
  return `${sign}${currencyPrefix(currency)} ${money.format(Math.abs(value))}`
}

export function formatMoneyParts(value: number, currency: Currency) {
  return {
    sign: value < 0 ? '−' : '',
    prefix: currencyPrefix(currency),
    amount: money.format(Math.abs(value)),
  }
}

export function formatSignedMoney(value: number, currency: Currency, kind: TxKind) {
  const sign = kind === 'income' ? '+' : '−'
  return `${sign}${currencyPrefix(currency)} ${money.format(Math.abs(value))}`
}

export function formatCompact(value: number) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}${compact.format(abs / 1_000_000)} M`
  if (abs >= 1_000) return `${sign}${compact.format(abs / 1_000)} mil`
  return `${sign}${whole.format(abs)}`
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toLocaleString('es-VE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

export function formatDelta(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toLocaleString('es-VE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`
}

export function parseAmountInput(raw: string) {
  if (!raw) return 0
  const normalized = raw.replace(/\./g, '').replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : 0
}

export function formatTypedAmount(raw: string) {
  if (!raw) return ''
  const [integer = '', decimals] = raw.split(',')
  const clean = integer.replace(/^0+(?=\d)/, '')
  const grouped = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimals !== undefined ? `${grouped},${decimals}` : grouped
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
