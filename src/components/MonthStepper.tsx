import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { isCurrentMonth, monthLabelUpper } from '../lib/dates'

interface MonthStepperProps {
  month: Date
  onChange: (month: Date) => void
  className?: string
}

export function MonthStepper({ month, onChange, className }: MonthStepperProps) {
  const nextDisabled = isCurrentMonth(month)

  return (
    <div
      className={cn(
        'inline-flex h-12 items-center rounded-btn border border-rule bg-surface md:h-9',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => {
          const next = new Date(month)
          next.setMonth(next.getMonth() - 1)
          onChange(next)
        }}
        aria-label="Mes anterior"
        className="flex h-full w-11 items-center justify-center rounded-l-btn text-muted transition-colors hover:bg-paper-2 hover:text-ink md:w-9"
      >
        <CaretLeft size={13} weight="bold" />
      </button>
      <span className="min-w-[128px] border-x border-rule px-2 text-center font-mono text-[9px] uppercase tracking-[0.1em] text-ink-2">
        {monthLabelUpper(month)}
      </span>
      <button
        type="button"
        disabled={nextDisabled}
        onClick={() => {
          const next = new Date(month)
          next.setMonth(next.getMonth() + 1)
          onChange(next)
        }}
        aria-label="Mes siguiente"
        className="flex h-full w-11 items-center justify-center rounded-r-btn text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent md:w-9"
      >
        <CaretRight size={13} weight="bold" />
      </button>
    </div>
  )
}
