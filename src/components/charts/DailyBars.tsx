import { useState } from 'react'
import { cn } from '../../lib/cn'
import { formatMoney } from '../../lib/format'
import { shortDay } from '../../lib/dates'
import type { Currency } from '../../db/types'

export interface DailyPoint {
  date: string
  value: number
}

interface DailyBarsProps {
  days: DailyPoint[]
  currency: Currency
  className?: string
}

export function DailyBars({ days, currency, className }: DailyBarsProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const values = days.map((day) => day.value)
  const max = Math.max(...values, 1)
  const active = activeIndex === null ? null : days[activeIndex]
  const average = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
  const averageHeight = (average / max) * 100
  const key = days[0]?.date ?? 'empty'

  return (
    <div className={className}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {active ? shortDay(active.date) : 'Promedio diario'}
        </span>
        <span className="font-mono text-[12px] tabular-nums text-ink-2">
          {formatMoney(active ? active.value : average, currency)}
        </span>
      </div>

      <div className="relative">
        <div
          key={key}
          className="flex h-36 items-end gap-[2px] md:h-52 md:gap-[3px]"
          role="img"
          aria-label="Gasto por día del mes. Usa las barras para ver cada día."
        >
          {days.map((day, index) => {
            const height = day.value > 0 ? Math.max(2.5, (day.value / max) * 100) : 1
            const isMax = day.value > 0 && day.value === max
            return (
              <button
                key={day.date}
                type="button"
                onPointerEnter={() => setActiveIndex(index)}
                onPointerLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                aria-label={`${shortDay(day.date)}: ${formatMoney(day.value, currency)}`}
                className="group flex h-full flex-1 cursor-default items-end border-0 bg-transparent p-0"
              >
                <span
                  style={{ height: `${height}%`, animationDelay: `${Math.min(index * 8, 220)}ms` }}
                  className={cn(
                    'bar-up block w-full rounded-[1px] transition-colors',
                    isMax ? 'bg-tomato' : 'bg-ink/20 dark:bg-ink/30',
                    activeIndex === index && 'bg-ink/55 dark:bg-ink/60',
                  )}
                />
              </button>
            )
          })}
        </div>

        {average > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-tomato/45"
            style={{ bottom: `${averageHeight}%` }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[9px] tabular-nums text-muted">
        <span>1</span>
        <span>8</span>
        <span>15</span>
        <span>22</span>
        <span>{days.length}</span>
      </div>
    </div>
  )
}
