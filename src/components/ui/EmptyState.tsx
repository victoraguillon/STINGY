import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface EmptyStateProps {
  title: string
  body: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border border-dashed border-rule bg-surface/40 px-5 py-8 text-left md:px-7 md:py-10',
        className,
      )}
    >
      <p className="max-w-[24ch] font-display text-[22px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
        {title}
      </p>
      <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
