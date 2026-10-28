import { cn } from '../lib/cn'
import { formatPercent, formatRate } from '../lib/format'
import { RATES, RATE_LABEL } from '../lib/fx'
import { shortDay } from '../lib/dates'
import type { RateType } from '../db/types'

function RateBlock({ type, className }: { type: RateType; className?: string }) {
  const rate = RATES[type]

  return (
    <div className={cn('flex items-baseline justify-between gap-5 py-3', className)}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="min-w-[54px] font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            {RATE_LABEL[type]}
          </span>
          <span className="font-mono text-[15px] tabular-nums leading-none text-ink">
            {formatRate(rate.value)}
          </span>
        </div>
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.07em] text-muted">
          {shortDay(rate.date)} ·{' '}
          {type === 'bcv' ? 'bolívares por dólar' : 'referencia de mercado'}
        </p>
      </div>
    </div>
  )
}

export function RateStrip({ className }: { className?: string }) {
  const gap = (RATES.paralelo.value / RATES.bcv.value - 1) * 100

  return (
    <section aria-label="Tasas de referencia" className={cn('border-y border-rule', className)}>
      <div className="flex items-center justify-between gap-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
        <span>Tasas de referencia</span>
        <span
          title="Diferencia del paralelo frente al BCV"
          className="text-ink-2"
        >
          Brecha {formatPercent(gap, 1)}
        </span>
      </div>
      <div className="grid sm:grid-cols-2">
        <RateBlock type="bcv" className="sm:pr-6" />
        <RateBlock
          type="paralelo"
          className="border-t border-rule sm:border-l sm:border-t-0 sm:pl-6"
        />
      </div>
    </section>
  )
}
