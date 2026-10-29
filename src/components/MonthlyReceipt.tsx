import { cn } from '../lib/cn'
import { monthKeyOf, monthLabelUpper, shortDay } from '../lib/dates'
import { formatMoney, formatRate } from '../lib/format'
import { useRates } from '../hooks/useRates'
import type { Profile } from '../db/types'
import { totalsIn, type Totals } from '../lib/analytics'
import { Money } from './Money'

interface MonthlyReceiptProps {
  month: Date
  profile: Profile
  totals: Totals
  className?: string
}

export function MonthlyReceipt({ month, profile, totals, className }: MonthlyReceiptProps) {
  const rates = useRates()
  const bcv = rates.bcv.value
  const base = profile.baseCurrency
  const other = base === 'VES' ? 'USD' : 'VES'
  const baseTotals = totalsIn(totals, base)
  const baseNet = baseTotals.net
  const otherNet = base === 'VES' ? baseNet / bcv : baseNet * bcv
  const income = baseTotals.income
  const expense = baseTotals.expense
  const empty = totals.incomeUsd === 0 && totals.expenseUsd === 0
  const firstName = profile.name.split(/\s+/)[0] ?? profile.name

  return (
    <div
      className={cn(
        'relative rounded-ticket border-[1.5px] border-ink/25 bg-surface px-5 pb-9 pt-4 md:px-6',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted">
          Resumen · {monthLabelUpper(month)}
        </p>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]',
            empty
              ? 'border-rule text-muted'
              : baseNet >= 0
                ? 'border-ink/25 text-ink-2'
                : 'border-tomato-text/40 text-tomato-text',
          )}
        >
          {empty ? 'Sin movimientos' : baseNet >= 0 ? 'Al día' : 'En rojo'}
        </span>
      </div>

      <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
        Balance del mes
      </p>
      <Money
        value={baseNet}
        currency={base}
        prefixClassName="text-ink/50"
        className="mt-1 text-[34px] md:text-[38px]"
      />
      <p className="mt-1.5 font-mono text-[11px] tabular-nums text-muted">
        {formatMoney(otherNet, other)} · a tasa BCV de hoy
      </p>

      <div className="mt-5 flex flex-col gap-2 border-t border-dashed border-rule pt-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[12px] text-ink-2">Ingresos</span>
          <span className="font-mono text-[12px] tabular-nums text-ink">
            + {formatMoney(income, base)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[12px] text-ink-2">Gastos</span>
          <span className="font-mono text-[12px] tabular-nums text-tomato-text">
            − {formatMoney(expense, base)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-rule pt-3">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
            BCV · {shortDay(rates.bcv.date)}
          </p>
          <p className="mt-1 font-mono text-[12px] tabular-nums text-ink">
            {formatRate(rates.bcv.value)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
            Paralelo · {shortDay(rates.paralelo.date)}
          </p>
          <p className="mt-1 font-mono text-[12px] tabular-nums text-ink">
            {formatRate(rates.paralelo.value)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-dashed border-rule pt-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
        <span>Cliente · {firstName}</span>
        <span>Folio {monthKeyOf(month)}</span>
      </div>

      <div className="receipt-tear" />
    </div>
  )
}
