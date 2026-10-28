import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'border border-ink bg-lime text-[#15160F] hover:bg-[#d5ef62] active:translate-y-px disabled:hover:bg-lime',
  secondary:
    'border border-ink/25 bg-surface text-ink hover:border-ink/50 active:translate-y-px',
  ghost:
    'border border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink active:translate-y-px',
  danger:
    'border border-tomato-text/40 bg-transparent text-tomato-text hover:border-tomato-text/70 hover:bg-tomato/8 active:translate-y-px',
  quiet:
    'border border-transparent bg-paper-2 text-ink-2 hover:bg-rule/60 hover:text-ink',
}

const sizes: Record<Size, string> = {
  sm: 'h-11 px-3 text-[13px] gap-1.5 md:h-9',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
  icon: 'h-11 w-11 p-0 justify-center',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled)
  const resolvedVariant = isDisabled && !loading && variant === 'primary' ? 'secondary' : variant

  return (
    <button
      type={type}
      disabled={isDisabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center rounded-btn font-medium leading-none transition-[background-color,border-color,transform,color] duration-150',
        loading ? 'cursor-wait' : 'disabled:cursor-not-allowed disabled:opacity-45',
        variants[resolvedVariant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center',
            resolvedVariant === 'primary' ? 'text-[#15160F]' : 'text-ink',
          )}
        >
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" />
        </span>
      )}
      <span className={cn('contents', loading && 'invisible')}>{children}</span>
      {loading && <span className="sr-only">Cargando</span>}
    </button>
  )
}
