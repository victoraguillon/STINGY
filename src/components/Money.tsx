import { cn } from '../lib/cn'
import { formatMoneyParts } from '../lib/format'
import type { Currency } from '../db/types'

interface MoneyProps {
  value: number
  currency: Currency
  className?: string
  prefixClassName?: string
}

export function Money({ value, currency, className, prefixClassName }: MoneyProps) {
  const { sign, prefix, amount } = formatMoneyParts(value, currency)

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-[0.32em] whitespace-nowrap font-mono font-medium leading-none tracking-[-0.04em] tabular-nums',
        className,
      )}
    >
      {sign && <span className="text-[0.72em]">{sign}</span>}
      <span
        className={cn(
          'text-[0.46em] font-medium uppercase tracking-[0.02em] text-muted',
          prefixClassName,
        )}
      >
        {prefix}
      </span>
      <span>{amount}</span>
    </span>
  )
}
