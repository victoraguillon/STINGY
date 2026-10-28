import { formatMoney } from '../../lib/format'
import { monthShort } from '../../lib/dates'
import type { Currency } from '../../db/types'

export interface MonthPoint {
  date: Date
  income: number
  expense: number
  net: number
}

interface DivergingBarsProps {
  months: MonthPoint[]
  currency: Currency
  className?: string
}

export function DivergingBars({ months, currency, className }: DivergingBarsProps) {
  const max = Math.max(
    ...months.flatMap((month) => [month.income, month.expense]),
    1,
  )
  const key = months[0]?.date.toISOString() ?? 'empty'

  return (
    <div className={className}>
      <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 border border-ink/25 bg-lime" />
          Ingresos
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 bg-tomato/85" />
          Gastos
        </span>
        <span className="ml-auto hidden normal-case tracking-normal md:inline">Neto debajo de cada mes</span>
      </div>

      <div key={key} className="flex gap-2 md:gap-5">
        {months.map((month, index) => (
          <div key={month.date.toISOString()} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex h-[86px] w-full items-end justify-center">
              <div
                title={`${monthShort(month.date)} · ingresos ${formatMoney(month.income, currency)}`}
                className="bar-up w-full max-w-[34px] rounded-t-[2px] border border-ink/15 bg-lime"
                style={{
                  height: `${Math.max((month.income / max) * 100, month.income > 0 ? 2 : 0)}%`,
                  animationDelay: `${index * 40}ms`,
                }}
              />
            </div>

            <div className="my-2 h-px w-full bg-rule" aria-hidden="true" />

            <div className="flex h-[86px] w-full items-start justify-center">
              <div
                title={`${monthShort(month.date)} · gastos ${formatMoney(month.expense, currency)}`}
                className="bar-down w-full max-w-[34px] rounded-b-[2px] bg-tomato/85"
                style={{
                  height: `${Math.max((month.expense / max) * 100, month.expense > 0 ? 2 : 0)}%`,
                  animationDelay: `${index * 40}ms`,
                }}
              />
            </div>

            <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
              {monthShort(month.date)}
            </span>
            <span className="mt-0.5 hidden font-mono text-[10px] tabular-nums text-muted md:block">
              {formatMoney(month.net, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
