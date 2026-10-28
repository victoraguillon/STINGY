import { TelegramLogo } from '@phosphor-icons/react'
import type { Category, Tx } from '../db/types'
import { cn } from '../lib/cn'
import { shortDay } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { txDisplayAmounts } from '../lib/analytics'
import { CategoryGlyph } from './CategoryGlyph'

interface TransactionRowProps {
  tx: Tx
  category?: Category
  onEdit: (tx: Tx) => void
  showDay?: boolean
  className?: string
}

export function TransactionRow({
  tx,
  category,
  onEdit,
  showDay = false,
  className,
}: TransactionRowProps) {
  const amounts = txDisplayAmounts(tx)
  const sign = tx.kind === 'income' ? '+' : '−'

  return (
    <button
      type="button"
      onClick={() => onEdit(tx)}
      aria-label={`Editar ${tx.note}, ${formatMoney(tx.amount, tx.currency)}`}
      className={cn(
        'group flex w-full items-center gap-3 border-b border-rule py-2.5 text-left transition-colors hover:bg-paper-2/70',
        className,
      )}
    >
      {showDay && (
        <span className="w-[44px] shrink-0 font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted">
          {shortDay(tx.occurredOn)}
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] leading-tight text-ink">{tx.note}</span>
          {tx.source === 'telegram' && (
            <TelegramLogo
              size={11}
              weight="bold"
              className="shrink-0 text-muted"
              aria-label="Anotado desde Telegram"
            />
          )}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[10px] leading-none text-muted">
          <CategoryGlyph icon={category?.icon ?? 'other'} size={11} />
          <span>{category?.name ?? 'Otros'}</span>
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block whitespace-nowrap font-mono text-[12.5px] leading-none tabular-nums text-ink">
          <span className="mr-0.5 text-muted">{sign}</span>
          {formatMoney(tx.amount, tx.currency)}
        </span>
        <span className="mt-1 block whitespace-nowrap font-mono text-[9px] leading-none tabular-nums text-muted">
          {formatMoney(amounts.secondary.value, amounts.secondary.currency)}
        </span>
      </span>
    </button>
  )
}
