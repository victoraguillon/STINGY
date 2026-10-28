import { CategoryGlyph } from '../CategoryGlyph'
import { formatMoney, formatPercent } from '../../lib/format'
import type { Category, Currency } from '../../db/types'

export interface CategorySlice {
  category: Category
  value: number
  share: number
}

interface CategoryBarsProps {
  slices: CategorySlice[]
  currency: Currency
  className?: string
}

export function CategoryBars({ slices, currency, className }: CategoryBarsProps) {
  return (
    <div className={className}>
      {slices.map((slice, index) => (
        <div
          key={slice.category.id}
          className="border-t border-rule py-3.5 first:border-t-0 first:pt-0"
        >
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <CategoryGlyph icon={slice.category.icon} size={15} className="shrink-0 text-muted" />
              <span className="truncate text-[14px] text-ink">{slice.category.name}</span>
            </div>
            <div className="flex shrink-0 items-baseline gap-3">
              <span className="font-mono text-[12px] tabular-nums text-ink-2">
                {formatMoney(slice.value, currency)}
              </span>
              <span className="w-[3.2ch] text-right font-display text-[20px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-ink">
                {formatPercent(slice.share)}
              </span>
            </div>
          </div>
          <div className="mt-2.5 h-[3px] w-full bg-rule/70">
            <div
              className="bar-up h-full bg-ink"
              style={{
                width: `${Math.min(slice.share, 100)}%`,
                animationDelay: `${index * 50}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
