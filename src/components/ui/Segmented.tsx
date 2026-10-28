import { cn } from '../../lib/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  size?: 'sm' | 'md'
  className?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex w-full items-stretch gap-0.5 rounded-btn border border-rule bg-paper-2 p-0.5',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-[9px] font-medium transition-[background-color,color,border-color] duration-150',
              size === 'sm' ? 'h-10 px-2 text-[12px] md:h-7' : 'h-10 px-3 text-[13px]',
              active
                ? 'border border-ink/30 bg-surface-2 text-ink'
                : 'border border-transparent text-muted hover:text-ink',
              option.disabled && 'cursor-not-allowed opacity-40',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
