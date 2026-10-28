import { MagnifyingGlass } from '@phosphor-icons/react'
import { endOfMonth, startOfMonth } from 'date-fns'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../db/db'
import type { Profile, TxKind } from '../db/types'
import { useQuickAdd } from '../app/quick-add'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { MonthStepper } from '../components/MonthStepper'
import { TransactionRow } from '../components/TransactionRow'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field } from '../components/ui/Field'
import { Segmented } from '../components/ui/Segmented'
import { cn } from '../lib/cn'
import {
  groupByDay,
  totalsIn,
} from '../lib/analytics'
import {
  dayHeader,
  fromDayString,
  monthLabel,
  toDayString,
} from '../lib/dates'
import { formatMoney } from '../lib/format'

type KindFilter = 'all' | TxKind
const ALL = 'all'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function TransactionsScreen({ profile }: { profile: Profile }) {
  const { open } = useQuickAdd()
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [categoryId, setCategoryId] = useState<string>(ALL)

  const start = toDayString(startOfMonth(month))
  const end = toDayString(endOfMonth(month))

  const rawTransactions = useLiveQuery(async () => {
    const rows = await db.transactions
      .where('occurredOn')
      .between(start, end, true, true)
      .toArray()
    return rows.filter((tx) => tx.ledgerId === profile.ledgerId)
  }, [start, end, profile.ledgerId])

  const categories =
    useLiveQuery(
      () => db.categories.where('ledgerId').equals(profile.ledgerId).toArray(),
      [profile.ledgerId],
    ) ?? []

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )

  const monthTransactions = rawTransactions ?? []
  const loading = rawTransactions === undefined
  const query = normalize(search)

  const usedCategoryIds = useMemo(
    () => new Set(monthTransactions.map((tx) => tx.categoryId)),
    [monthTransactions],
  )
  const filterCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          usedCategoryIds.has(category.id) &&
          (kind === ALL || category.kind === kind),
      ),
    [categories, usedCategoryIds, kind],
  )

  const visibleCategoryId =
    categoryId !== ALL && !filterCategories.some((category) => category.id === categoryId)
      ? ALL
      : categoryId

  const filtered = useMemo(() => {
    return monthTransactions.filter((tx) => {
      if (kind !== ALL && tx.kind !== kind) return false
      if (visibleCategoryId !== ALL && tx.categoryId !== visibleCategoryId) return false
      if (query) {
        const categoryName = categoryMap.get(tx.categoryId)?.name ?? ''
        if (!normalize(`${tx.note} ${categoryName}`).includes(query)) return false
      }
      return true
    })
  }, [monthTransactions, kind, visibleCategoryId, query, categoryMap])

  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const hasFilters = query.length > 0 || kind !== ALL || visibleCategoryId !== ALL

  function clearFilters() {
    setSearch('')
    setKind('all')
    setCategoryId(ALL)
  }

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Libro</p>
          <h1 className="mt-1 font-display text-[34px] font-semibold leading-[0.95] tracking-[-0.045em] text-ink md:text-[42px]">
            Movimientos
          </h1>
          <p className="mt-2 text-[12px] text-muted md:text-[13px]">
            {loading
              ? 'Leyendo el libro…'
              : `${filtered.length} ${filtered.length === 1 ? 'movimiento' : 'movimientos'} ${
                  hasFilters ? `de ${monthTransactions.length}` : `en ${monthLabel(month)}`
                }`}
          </p>
        </div>
        <MonthStepper month={month} onChange={setMonth} className="hidden md:inline-flex" />
      </header>

      <div className="md:hidden">
        <MonthStepper month={month} onChange={setMonth} className="w-full justify-between" />
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px] md:items-end">
        <Field
          label="Buscar"
          icon={<MagnifyingGlass size={15} weight="bold" />}
          placeholder="Nota o categoría"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="min-w-0"
        />
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Tipo
          </span>
          <Segmented
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'expense', label: 'Gastos' },
              { value: 'income', label: 'Ingresos' },
            ]}
            value={kind}
            onChange={(value) => setKind(value)}
            label="Tipo de movimiento"
          />
        </div>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
        <button
          type="button"
          aria-pressed={visibleCategoryId === ALL}
          onClick={() => setCategoryId(ALL)}
          className={cn(
            'inline-flex h-11 shrink-0 items-center rounded-full border px-2.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors md:h-7',
            visibleCategoryId === ALL
              ? 'border-ink bg-ink text-paper'
              : 'border-rule bg-surface text-muted hover:border-ink/30 hover:text-ink',
          )}
        >
          Todas
        </button>
        {filterCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={visibleCategoryId === category.id}
            onClick={() =>
              setCategoryId((current) => (current === category.id ? ALL : category.id))
            }
            className={cn(
              'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] transition-colors md:h-7',
              visibleCategoryId === category.id
                ? 'border-ink bg-lime text-[#15160F]'
                : 'border-rule bg-surface text-ink-2 hover:border-ink/30',
            )}
          >
            <CategoryGlyph icon={category.icon} size={11} />
            {category.name}
          </button>
        ))}
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between gap-4 border-t border-rule pt-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
            Filtros activos
          </span>
          <button
            type="button"
            onClick={clearFilters}
            className="tap-link font-mono text-[9px] uppercase tracking-[0.1em] text-ink-2 underline decoration-rule underline-offset-4 hover:decoration-ink"
          >
            Limpiar
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 border-b border-rule py-3.5"
              aria-hidden="true"
            >
              <span className="h-2 w-8 animate-pulse bg-rule" />
              <span className="h-2.5 flex-1 animate-pulse bg-rule" />
              <span className="h-2.5 w-16 animate-pulse bg-rule" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          title={monthTransactions.length === 0 ? 'Ni un movimiento este mes.' : 'Nada con esos filtros.'}
          body={
            monthTransactions.length === 0
              ? 'El primero es el que cuenta. Anótalo y empieza a ver el mes.'
              : 'Prueba con otra categoría, otro tipo o limpia la búsqueda.'
          }
          action={
            monthTransactions.length === 0 ? (
              <Button variant="primary" size="sm" onClick={() => open({ kind: 'expense' })}>
                Anotar el primero
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )
          }
        />
      ) : (
        <div>
          {groups.map((group) => {
            const dayNet = totalsIn(group.totals, profile.baseCurrency).net
            return (
              <div key={group.date}>
                <div className="sticky top-0 z-10 flex items-baseline justify-between gap-4 border-b border-rule bg-paper py-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-2">
                    {dayHeader(fromDayString(group.date))}
                  </span>
                  <span className="font-mono text-[9px] tabular-nums text-muted">
                    {dayNet >= 0 ? '+' : '−'} {formatMoney(Math.abs(dayNet), profile.baseCurrency)}
                  </span>
                </div>
                {group.transactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    category={categoryMap.get(tx.categoryId)}
                    onEdit={(entry) => open({ tx: entry })}
                    className="last:border-b-0"
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
