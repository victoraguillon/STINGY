import { cn } from '../../lib/cn'

interface StampProps {
  label: string
  tone?: 'ink' | 'tomato' | 'lime'
  animate?: boolean
  className?: string
}

export function Stamp({ label, tone = 'ink', animate = false, className }: StampProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex select-none items-center justify-center rounded-[3px] border-2 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]',
        tone === 'ink' && 'border-ink text-ink',
        tone === 'tomato' && 'border-tomato-text text-tomato-text',
        tone === 'lime' && 'border-ink bg-lime text-[#15160F]',
        '-rotate-[8deg]',
        animate && 'stamp-in',
        className,
      )}
    >
      {label}
    </span>
  )
}
