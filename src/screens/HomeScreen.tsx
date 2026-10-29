import { Plus } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { endOfMonth, startOfMonth } from 'date-fns'
import { Link } from 'react-router-dom'
import { db } from '../db/db'
import type { Profile } from '../db/types'
import { useQuickAdd } from '../app/quick-add'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { MonthStepper } from '../components/MonthStepper'
import { MonthlyReceipt } from '../components/MonthlyReceipt'
import { RateStrip } from '../components/RateStrip'
import { SectionHeader } from '../components/SectionHeader'
import { TransactionRow } from '../components/TransactionRow'
import { CategoryBars } from '../components/charts/CategoryBars'
import { DailyBars } from '../components/charts/DailyBars'
import { cn } from '../lib/cn'
import {
  categorySlices,
  dailySeries,
  sortByNewest,
  totalsOf,
} from '../lib/analytics'
import {
  longDate,
  monthKeyOf,
  monthLabelUpper,
  toDayString,
} from '../lib/dates'
import { formatMoney } from '../lib/format'

const linkClass =
  'tap-link font-mono text-[9px] uppercase tracking-[0.1em] text-ink-2 underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink'

export function HomeScreen({ profile }: { profile: Profile }) {
  const { open } = useQuickAdd()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const start = toDayString(startOfMonth(month))
  const end = toDayString(endOfMonth(month))

  const transactions =
    useLiveQuery(async () => {
      const rows = await db.transactions
        .where('occurredOn')
        .between(start, end, true, true)
        .toArray()
      return rows.filter((tx) => tx.ledgerId === profile.ledgerId && !tx.deletedAt)
    }, [start, end, profile.ledgerId]) ?? []

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

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const totals = useMemo(() => totalsOf(transactions), [transactions])
  const base = profile.baseCurrency
  const daily = useMemo(
    () => dailySeries(transactions, month, base),
    [transactions, month, base],
  )
  const slices = useMemo(
    () => categorySlices(transactions, categories, base).slice(0, 4),
    [transactions, categories, base],
  )
  const recent = useMemo(() => sortByNewest(transactions).slice(0, 5), [transactions])
  const peak = useMemo(
    () => daily.reduce((best, day) => (day.value > best.value ? day : best), daily[0] ?? { date: '', value: 0 }),
    [daily],
  )
  const firstName = profile.name.split(/\s+/)[0] ?? profile.name

  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[34px] font-semibold leading-[0.95] tracking-[-0.045em] text-ink md:text-[44px]">
              Hola, {firstName}.
            </h1>
            <p className="mt-2 text-[12px] text-muted md:text-[13px]">
              {longDate(new Date())}
              <span className="px-1.5 text-rule">·</span>
              {profile.demo ? 'Datos de ejemplo' : 'Supabase + copia local'}
            </p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <MonthStepper month={month} onChange={setMonth} />
            <Button variant="primary" onClick={() => open({ kind: 'expense' })}>
              <Plus size={15} weight="bold" />
              Anotar
            </Button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between md:hidden">
          <MonthStepper month={month} onChange={setMonth} />
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
            {profile.demo ? 'Demo' : 'Sync activo'}
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-6">
        <div className="lg:col-span-5">
          <div key={monthKeyOf(month)} className="fade-swap">
            <MonthlyReceipt month={month} profile={profile} totals={totals} />
          </div>
        </div>

        <section className="lg:col-span-7" aria-label="Gasto por día">
          <SectionHeader
            index="01"
            title="Gasto por día"
            meta={totals.expenseUsd > 0 ? `Pico ${formatMoney(peak.value, base)}` : undefined}
          />
          {totals.expenseUsd > 0 ? (
            <>
              <DailyBars days={daily} currency={base} className="mt-4" />
              <div className="mt-3 flex items-start gap-2.5 border-t border-rule pt-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-tomato" aria-hidden="true" />
                <p className="text-[12px] leading-relaxed text-ink-2">
                  El día más caro fue el{' '}
                  <span className="font-mono text-[11px] tabular-nums">
                    {peak.date ? Number(peak.date.slice(-2)) : '—'}
                  </span>
                  , con{' '}
                  <span className="font-mono text-[11px] tabular-nums">
                    {formatMoney(peak.value, base)}
                  </span>
                  .
                </p>
              </div>
            </>
          ) : (
            <EmptyState
              className="mt-4 border-0 bg-transparent px-0 py-8"
              title="Todavía no hay gastos."
              body="Anota el primero y aquí aparecerá el pulso del mes."
              action={
                <Button size="sm" variant="secondary" onClick={() => open({ kind: 'expense' })}>
                  Anotar gasto
                </Button>
              }
            />
          )}
        </section>
      </div>

      <RateStrip />

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-6">
        <section className="lg:col-span-5" aria-label="En qué se fue el dinero">
          <SectionHeader
            index="02"
            title="En qué se fue"
            meta={`${slices.length} ${slices.length === 1 ? 'categoría' : 'categorías'}`}
            action={
              <Link to="/reportes" className={linkClass}>
                Reportes
              </Link>
            }
          />
          {slices.length > 0 ? (
            <CategoryBars slices={slices} currency={base} className="mt-4" />
          ) : (
            <p className="mt-4 border-t border-rule py-6 text-[13px] text-muted">
              Sin gastos en {monthLabelUpper(month)}. Aquí verás el reparto por categoría.
            </p>
          )}
        </section>

        <section className="lg:col-span-7" aria-label="Últimos movimientos">
          <SectionHeader
            index="03"
            title="Últimos movimientos"
            action={
              <Link to="/movimientos" className={linkClass}>
                Ver todos
              </Link>
            }
          />
          {recent.length > 0 ? (
            <div className="mt-1">
              {recent.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  category={categoryMap.get(tx.categoryId)}
                  onEdit={(entry) => open({ tx: entry })}
                  showDay
                  className={cn('last:border-b-0')}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              title="Ni un movimiento. El primero es el que cuenta."
              body="Anota un gasto o un ingreso y empieza el mes."
              action={
                <Button size="sm" variant="primary" onClick={() => open({ kind: 'expense' })}>
                  Anotar el primero
                </Button>
              }
            />
          )}
        </section>
      </div>
    </div>
  )
}
