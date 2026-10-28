import type { Category, Currency, Tx } from '../db/types'
import { monthDays, toDayString, fromDayString } from './dates'
import { RATES, RATE_LABEL } from './fx'

export interface Totals {
  incomeUsd: number
  expenseUsd: number
  netUsd: number
  incomeVes: number
  expenseVes: number
  netVes: number
}

export function txValue(tx: Tx, currency: Currency) {
  if (tx.currency === currency) return tx.amount
  if (currency === 'VES') return tx.amount * tx.rate
  return tx.amount / tx.rate
}

export function totalsOf(transactions: Tx[]): Totals {
  let incomeUsd = 0
  let expenseUsd = 0
  let incomeVes = 0
  let expenseVes = 0
  for (const tx of transactions) {
    const usd = txValue(tx, 'USD')
    const ves = txValue(tx, 'VES')
    if (tx.kind === 'income') {
      incomeUsd += usd
      incomeVes += ves
    } else {
      expenseUsd += usd
      expenseVes += ves
    }
  }
  return {
    incomeUsd,
    expenseUsd,
    netUsd: incomeUsd - expenseUsd,
    incomeVes,
    expenseVes,
    netVes: incomeVes - expenseVes,
  }
}

export function totalsIn(totals: Totals, currency: Currency) {
  return currency === 'VES'
    ? { income: totals.incomeVes, expense: totals.expenseVes, net: totals.netVes }
    : { income: totals.incomeUsd, expense: totals.expenseUsd, net: totals.netUsd }
}

export function toDisplay(usd: number, currency: Currency, bcv = RATES.bcv.value) {
  return currency === 'VES' ? usd * bcv : usd
}

export function inRange(tx: Tx, start: string, end: string) {
  return tx.occurredOn >= start && tx.occurredOn <= end
}

export function filterRange(transactions: Tx[], start: string, end: string) {
  return transactions.filter((tx) => inRange(tx, start, end))
}

export interface DayGroup {
  date: string
  transactions: Tx[]
  totals: Totals
}

export function groupByDay(transactions: Tx[]): DayGroup[] {
  const map = new Map<string, Tx[]>()
  for (const tx of transactions) {
    const list = map.get(tx.occurredOn) ?? []
    list.push(tx)
    map.set(tx.occurredOn, list)
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, list]) => ({
      date,
      transactions: list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      totals: totalsOf(list),
    }))
}

export function dailySeries(
  transactions: Tx[],
  month: Date,
  currency: Currency,
) {
  const values = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.kind !== 'expense') continue
    values.set(tx.occurredOn, (values.get(tx.occurredOn) ?? 0) + txValue(tx, currency))
  }
  return monthDays(month).map((day) => {
    const key = toDayString(day)
    return { date: key, value: values.get(key) ?? 0 }
  })
}

export function monthlySeries(
  transactions: Tx[],
  months: Date[],
  currency: Currency,
) {
  return months.map((month) => {
    const prefix = `${toDayString(month).slice(0, 7)}`
    const scoped = transactions.filter((tx) => tx.occurredOn.startsWith(prefix))
    const totals = totalsIn(totalsOf(scoped), currency)
    return {
      date: month,
      income: totals.income,
      expense: totals.expense,
      net: totals.net,
    }
  })
}

export function categorySlices(
  transactions: Tx[],
  categories: Category[],
  currency: Currency,
): Array<{ category: Category; value: number; share: number }> {
  const expenses = transactions.filter((tx) => tx.kind === 'expense')
  const expenseTotal = expenses.reduce((sum, tx) => sum + txValue(tx, currency), 0)
  const byCategory = new Map<string, number>()
  for (const tx of expenses) {
    byCategory.set(
      tx.categoryId,
      (byCategory.get(tx.categoryId) ?? 0) + txValue(tx, currency),
    )
  }
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  return [...byCategory.entries()]
    .map(([categoryId, value]) => {
      const category =
        categoryMap.get(categoryId) ??
        ({
          id: categoryId,
          ledgerId: '',
          name: 'Otros',
          icon: 'other',
          kind: 'expense',
          order: 99,
        } satisfies Category)
      return {
        category,
        value,
        share: expenseTotal > 0 ? (value / expenseTotal) * 100 : 0,
      }
    })
    .sort((a, b) => b.value - a.value)
}

export function heatmapData(transactions: Tx[], currency: Currency) {
  const map = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.kind !== 'expense') continue
    map.set(tx.occurredOn, (map.get(tx.occurredOn) ?? 0) + txValue(tx, currency))
  }
  return map
}

export function txDisplayAmounts(tx: Tx) {
  if (tx.currency === 'VES') {
    return {
      primary: { value: tx.amount, currency: 'VES' as Currency },
      secondary: {
        value: tx.amountUsd,
        currency: 'USD' as Currency,
        suffix: `${RATE_LABEL[tx.rateType]} al anotar`,
      },
    }
  }
  return {
    primary: { value: tx.amount, currency: 'USD' as Currency },
    secondary: {
      value: tx.amount * tx.rate,
      currency: 'VES' as Currency,
      suffix: RATE_LABEL[tx.rateType],
    },
  }
}

export function transactionsInMonth(transactions: Tx[], month: Date) {
  const prefix = toDayString(month).slice(0, 7)
  return transactions.filter((tx) => tx.occurredOn.startsWith(prefix))
}

export function transactionsForHeatmap(
  transactions: Tx[],
  start: Date,
  end: Date,
) {
  const startKey = toDayString(start)
  const endKey = toDayString(end)
  return transactions.filter(
    (tx) => tx.occurredOn >= startKey && tx.occurredOn <= endKey,
  )
}

export function dayNetLabel(totals: Totals, currency: Currency) {
  return totalsIn(totals, currency).net
}

export function sortByNewest(transactions: Tx[]) {
  return [...transactions].sort((a, b) => {
    if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1
    return a.createdAt < b.createdAt ? 1 : -1
  })
}

export function daysBetweenLabel(start: string, end: string) {
  const a = fromDayString(start)
  const b = fromDayString(end)
  const formatter = new Intl.DateTimeFormat('es-VE', { day: 'numeric', month: 'short' })
  return `${formatter.format(a)} — ${formatter.format(b)}`
}
