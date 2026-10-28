import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCompact, formatMoney } from '../../lib/format'
import { capitalize, monthHeatmapCells, toDayString } from '../../lib/dates'
import { cn } from '../../lib/cn'
import type { Currency } from '../../db/types'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const LEVELS = [
  'bg-rule/30',
  'bg-heat-1',
  'bg-heat-2',
  'bg-heat-3',
  'bg-heat-4',
]
const LEVEL_TEXT = [
  'text-muted',
  'text-ink/70 dark:text-[#F2F0E6]/75',
  'text-ink/80 dark:text-[#F2F0E6]/85',
  'text-ink dark:text-[#F2F0E6]',
  'text-white dark:text-[#15160F]',
]

function thresholds(values: number[]) {
  const positive = values.filter((value) => value > 0).sort((a, b) => a - b)
  if (positive.length === 0) return [1, 2, 3, 4]
  const at = (q: number) => positive[Math.min(positive.length - 1, Math.floor(q * positive.length))] ?? 1
  const base = [at(0.25), at(0.5), at(0.75), at(0.92)]
  return base.map((value, index) => (index === 0 ? value : Math.max(value, (base[index - 1] ?? 0) + 0.0001)))
}

function levelFor(value: number, cuts: number[]) {
  if (value <= 0) return 0
  if (value <= (cuts[0] ?? 0)) return 1
  if (value <= (cuts[1] ?? 0)) return 2
  if (value <= (cuts[2] ?? 0)) return 3
  return 4
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
      <span>Menos</span>
      {LEVELS.map((level, index) => (
        <span
          key={level}
          className={cn('h-2.5 w-2.5 rounded-[1px]', level, index === 0 && 'border border-rule')}
        />
      ))}
      <span>Más</span>
    </div>
  )
}

interface HeatmapProps {
  mode: 'month' | 'year'
  month: Date
  data: Map<string, number>
  currency: Currency
  className?: string
}

export function Heatmap({ mode, month, data, currency, className }: HeatmapProps) {
  const values = [...data.values()]
  const cuts = thresholds(values)
  const total = values.reduce((sum, value) => sum + value, 0)
  const activeDays = values.filter((value) => value > 0).length

  if (mode === 'month') {
    const cells = monthHeatmapCells(month)
    return (
      <div className={className}>
        <div className="grid max-w-[430px] grid-cols-7 gap-1.5">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="pb-1 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-muted"
            >
              {day}
            </div>
          ))}
          {cells.map((cell, index) => {
            if (!cell) return <div key={`blank-${index}`} aria-hidden="true" />
            const value = data.get(toDayString(cell.date)) ?? 0
            const level = levelFor(value, cuts)
            return (
              <div
                key={cell.date.toISOString()}
                title={`${format(cell.date, "d 'de' MMMM", { locale: es })} · ${
                  value > 0 ? formatMoney(value, currency) : 'Sin gastos'
                }`}
                className={cn(
                  'relative flex aspect-square items-start justify-start rounded-[3px] p-1.5 font-mono text-[9px] leading-none tabular-nums',
                  LEVELS[level],
                  level === 0 && 'border border-rule/60',
                  LEVEL_TEXT[level],
                )}
              >
                {cell.day}
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
          <span className="font-mono text-[10px] tabular-nums text-muted">
            {activeDays} días con gasto · {formatMoney(total, currency)}
          </span>
          <Legend />
        </div>
      </div>
    )
  }

  const months = Array.from({ length: 12 }, (_, index) => new Date(month.getFullYear(), index, 1))
  const yearTotal = values.reduce((sum, value) => sum + value, 0)

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {months.map((entry) => {
          const cells = monthHeatmapCells(entry)
          const monthTotal = cells.reduce(
            (sum, cell) => (cell ? sum + (data.get(toDayString(cell.date)) ?? 0) : sum),
            0,
          )
          return (
            <div key={entry.toISOString()} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-2">
                  {capitalize(format(entry, 'MMM', { locale: es })).replace('.', '')}
                </span>
                <span className="font-mono text-[9px] tabular-nums text-muted">
                  {formatCompact(monthTotal)}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-[2px]">
                {cells.map((cell, index) => {
                  if (!cell) return <div key={`blank-${index}`} aria-hidden="true" />
                  const value = data.get(toDayString(cell.date)) ?? 0
                  const level = levelFor(value, cuts)
                  return (
                    <div
                      key={cell.date.toISOString()}
                      title={`${format(cell.date, "d 'de' MMMM", { locale: es })} · ${
                        value > 0 ? formatMoney(value, currency) : 'Sin gastos'
                      }`}
                      className={cn(
                        'aspect-square rounded-[1px]',
                        LEVELS[level],
                        level === 0 && 'border border-rule/50',
                      )}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-3">
        <span className="font-mono text-[10px] tabular-nums text-muted">
          {formatMoney(yearTotal, currency)} en {month.getFullYear()}
        </span>
        <Legend />
      </div>
    </div>
  )
}
