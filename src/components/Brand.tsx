import { useId } from 'react'
import { cn } from '../lib/cn'

export function CoinMark({
  size = 24,
  className,
}: {
  size?: number
  className?: string
}) {
  const rawId = useId()
  const maskId = `coin-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <mask id={maskId}>
        <rect width="32" height="32" fill="#fff" />
        <circle cx="31" cy="6" r="5.7" fill="#000" />
        <circle cx="27" cy="1.4" r="3.5" fill="#000" />
        <circle cx="32" cy="12" r="3.4" fill="#000" />
        <circle cx="15.5" cy="16" r="9.9" fill="#000" />
        <circle cx="15.5" cy="16" r="8.55" fill="#fff" />
      </mask>
      <circle cx="15.5" cy="16" r="12" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display font-extrabold lowercase leading-none tracking-[-0.06em]',
        className,
      )}
    >
      stingy
    </span>
  )
}

export function BrandLockup({
  className,
  coinSize = 22,
  textClassName,
}: {
  className?: string
  coinSize?: number
  textClassName?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-ink', className)}>
      <CoinMark size={coinSize} />
      <Wordmark className={cn('text-[20px]', textClassName)} />
    </span>
  )
}
