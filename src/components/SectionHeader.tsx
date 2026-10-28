import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

interface SectionHeaderProps {
  index?: string
  title: string
  meta?: ReactNode
  action?: ReactNode
  className?: string
}

export function SectionHeader({ index, title, meta, action, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-rule pb-2.5',
        className,
      )}
    >
      <div className="flex items-baseline gap-2.5">
        {index && <span className="font-mono text-[9px] text-muted">{index}</span>}
        <h2 className="font-display text-[17px] font-semibold leading-none tracking-[-0.025em] text-ink">
          {title}
        </h2>
      </div>
      {(meta || action) && (
        <div className="flex items-center gap-3">
          {meta && (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
              {meta}
            </span>
          )}
          {action}
        </div>
      )}
    </div>
  )
}
