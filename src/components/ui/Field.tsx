import { useId, type ComponentProps, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface FieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string
  hint?: string
  error?: string
  containerClassName?: string
  icon?: ReactNode
}

export function Field({
  label,
  hint,
  error,
  className,
  containerClassName,
  icon,
  ...props
}: FieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <label
        htmlFor={id}
        className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? descriptionId : undefined}
          className={cn(
            'h-11 w-full rounded-btn border border-rule bg-surface px-3.5 text-[15px] text-ink outline-none transition-colors',
            'hover:border-ink/30 focus:border-ink focus-visible:outline-none',
            icon && 'pl-10',
            error && 'border-tomato-text',
            className,
          )}
          {...props}
        />
      </div>
      {(hint || error) && (
        <p
          id={descriptionId}
          className={cn('text-[12px] leading-snug', error ? 'text-tomato-text' : 'text-muted')}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
