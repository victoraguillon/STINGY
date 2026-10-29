import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { startOfMonth } from 'date-fns'
import { db } from '../db/db'
import type { Currency, Profile } from '../db/types'
import { CategoryBars } from '../components/charts/CategoryBars'
import { DivergingBars } from '../components/charts/DivergingBars'
import { Heatmap } from '../components/charts/Heatmap'
import { Money } from '../components/Money'
import { SectionHeader } from '../components/SectionHeader'
import { Segmented } from '../components/ui/Segmented'
import { cn } from '../lib/cn'
import {
  categorySlices,
  daysBetweenLabel,
  heatmapData,
  inRange,
  monthlySeries,
  totalsIn,
  totalsOf,
} from '../lib/analytics'
import {
  lastDaysRange,
  lastMonths,
  monthLabel,
  monthRange,
  shortDay,
  toDayString,
  yearRange,
} from '../lib/dates'
import { formatMoney } from '../lib/format'

type Period = 'week' | 'month' | 'year'

function DataTable({
  headers,
  rows,
  label = 'Ver como tabla',
}: {
  headers: string[]
  rows: Array<Array<string | number>>
  label?: string
}) {
  if (rows.length === 0) return null
  return (
    <details className="mt-4 border-t border-rule pt-2.5">
      <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-ink">
        {label}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-rule">
              {headers.map((header, index) => (
                <th
                  key={header}
                  className={cn(
                    'pb-1.5 font-mono text-[8px] font-normal uppercase tracking-[0.1em] text-muted',
                    index > 0 && 'text-right',
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-rule/60">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      'py-1.5 text-[11px]',
                      cellIndex === 0 ? 'text-ink-2' : 'text-right font-mono tabular-nums text-ink',
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}

export function ReportsScreen({ profile }: { profile: Profile }) {
  const [period, setPeriod] = useState<Period>('month')
  const [currency, setCurrency] = useState<Currency>(profile.baseCurrency)
  const today = useMemo(() => new Date(), [])

  const rawTransactions = useLiveQuery(
    () =>
      db.transactions
        .where('ledgerId')
        .equals(profile.ledgerId)
        .toArray()
        .then((rows) => rows.filter((tx) => !tx.deletedAt)),
    [profile.ledgerId],
  )

  const categories =
    useLiveQuery(
      () =>
        db.categories
          .where('ledgerId')
          .equals(profile.ledgerId)
          .toArray()
          .then((rows) => rows.filter((category) => !category.deletedAt)),
      [profile.ledgerId],
    ) ?? []

  const range = useMemo(() => {
    if (period === 'week') return lastDaysRange(7, today)
    if (period === 'year') return yearRange(today)
    return monthRange(today)
  }, [period, today])

  const allTransactions = rawTransactions ?? []
  const periodTransactions = useMemo(
    () => allTransactions.filter((tx) => inRange(tx, range.start, range.end)),
    [allTransactions, range.start, range.end],
  )
  const totals = useMemo(() => totalsOf(periodTransactions), [periodTransactions])
  const displayTotals = totalsIn(totals, currency)
  const net = displayTotals.net
  const income = displayTotals.income
  const expense = displayTotals.expense

  const months = useMemo(() => lastMonths(6, today), [today])
  const series = useMemo(
    () => monthlySeries(allTransactions, months, currency),
    [allTransactions, months, currency],
  )
  const slices = useMemo(
    () => categorySlices(periodTransactions, categories, currency),
    [periodTransactions, categories, currency],
  )

  const heatMonth = startOfMonth(today)
  const heatRange = period === 'year' ? yearRange(today) : monthRange(today)
  const heatTransactions = useMemo(
    () => allTransactions.filter((tx) => inRange(tx, heatRange.start, heatRange.end)),
    [allTransactions, heatRange.start, heatRange.end],
  )
  const heatData = useMemo(
    () => heatmapData(heatTransactions, currency),
    [heatTransactions, currency],
  )

  const rangeLabel =
    period === 'week'
      ? daysBetweenLabel(range.start, range.end)
      : period === 'month'
        ? monthLabel(today)
        : `${today.getFullYear()}`

  const headline =
    period === 'week'
      ? 'Tu semana, en números.'
      : period === 'month'
        ? 'Tu mes, en números.'
        : 'Tu año, en números.'

  const periodTableRows = series.map((month) => [
    monthLabel(month.date),
    formatMoney(month.income, currency),
    formatMoney(month.expense, currency),
    formatMoney(month.net, currency),
  ])

  const categoryTableRows = slices.map((slice) => [
    slice.category.name,
    formatMoney(slice.value, currency),
    `${Math.round(slice.share)}%`,
  ])

  const heatTableRows =
    period === 'year'
      ? Array.from({ length: 12 }, (_, index) => {
          const monthDate = new Date(today.getFullYear(), index, 1)
          const prefix = toDayString(monthDate).slice(0, 7)
          const total = [...heatData.entries()]
            .filter(([day]) => day.startsWith(prefix))
            .reduce((sum, [, value]) => sum + value, 0)
          return [monthLabel(monthDate), formatMoney(total, currency)]
        })
      : [...heatData.entries()]
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([day, value]) => [shortDay(day), formatMoney(value, currency)])

  if (rawTransactions === undefined) {
    return (
      <div className="flex flex-col gap-6" aria-label="Cargando reportes">
        <div className="h-10 w-52 animate-pulse bg-rule" />
        <div className="h-24 w-full animate-pulse bg-rule/60" />
        <div className="h-64 w-full animate-pulse bg-rule/40" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <header className="flex flex-col gap-5">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Reportes</p>
          <h1 className="mt-1 font-display text-[34px] font-semibold leading-[0.95] tracking-[-0.045em] text-ink md:text-[42px]">
            {headline}
          </h1>
          <p className="mt-2 text-[12px] text-muted md:text-[13px]">
            {rangeLabel}
            <span className="px-1.5 text-rule">·</span>
            {currency === 'VES' ? 'Bolívares' : 'Dólares'}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Segmented
            className="w-[300px] max-w-full"
            options={[
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mes' },
              { value: 'year', label: 'Año' },
            ]}
            value={period}
            onChange={setPeriod}
            label="Período"
          />
          <Segmented
            className="w-[148px]"
            options={[
              { value: 'VES', label: 'Bs' },
              { value: 'USD', label: '$' },
            ]}
            value={currency}
            onChange={setCurrency}
            label="Moneda de los reportes"
          />
        </div>
      </header>

      <section className="border-y border-rule py-6 md:py-8" aria-label="Balance del período">
        <div
          key={`${period}-${currency}`}
          className="fade-swap flex flex-wrap items-end justify-between gap-x-10 gap-y-6"
        >
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Balance del período
            </p>
            <Money
              value={net}
              currency={currency}
              className={cn(
                'mt-2 text-[clamp(36px,6.6vw,74px)]',
                net < 0 ? 'text-tomato-text' : 'text-ink',
              )}
              prefixClassName={net < 0 ? 'text-tomato-text/60' : 'text-ink/45'}
            />
            <p className="mt-3 max-w-[52ch] font-mono text-[10px] leading-relaxed text-muted">
              Cada monto usa la tasa que se guardó al anotarlo. Cambiar la moneda solo
              cambia la lectura, no lo anotado.
            </p>
          </div>

          <div className="flex gap-8 pb-1">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                Ingresos
              </p>
              <p className="mt-1 font-mono text-[14px] tabular-nums text-ink">
                + {formatMoney(income, currency)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                Gastos
              </p>
              <p className="mt-1 font-mono text-[14px] tabular-nums text-tomato-text">
                − {formatMoney(expense, currency)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Últimos seis meses">
        <SectionHeader
          index="01"
          title="Últimos seis meses"
          meta="Ingresos y gastos"
        />
        <DivergingBars months={series} currency={currency} className="mt-5" />
        <DataTable
          headers={['Mes', 'Ingresos', 'Gastos', 'Neto']}
          rows={periodTableRows}
          label="Ver los seis meses como tabla"
        />
      </section>

      <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-8">
        <section className="lg:col-span-5" aria-label="Gasto por categoría">
          <SectionHeader
            index="02"
            title="En qué se fue"
            meta={`${slices.length} ${slices.length === 1 ? 'categoría' : 'categorías'}`}
          />
          {slices.length > 0 ? (
            <CategoryBars slices={slices} currency={currency} className="mt-4" />
          ) : (
            <p className="mt-4 border-t border-rule py-6 text-[13px] leading-relaxed text-muted">
              Sin gastos en este período. Cuando anotes el primero, aquí aparecerá el
              reparto.
            </p>
          )}
          <DataTable
            headers={['Categoría', 'Monto', 'Parte']}
            rows={categoryTableRows}
            label="Ver las categorías como tabla"
          />
        </section>

        <section className="lg:col-span-7" aria-label="Mapa de gasto">
          <SectionHeader
            index="03"
            title="Mapa de gasto"
            meta={period === 'year' ? `${today.getFullYear()}` : monthLabel(heatMonth)}
          />
          <Heatmap
            mode={period === 'year' ? 'year' : 'month'}
            month={heatMonth}
            data={heatData}
            currency={currency}
            className="mt-5"
          />
          <DataTable
            headers={period === 'year' ? ['Mes', 'Gasto'] : ['Día', 'Gasto']}
            rows={heatTableRows}
            label="Ver el mapa como tabla"
          />
        </section>
      </div>
    </div>
  )
}
