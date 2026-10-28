import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  variant?: 'sheet' | 'dialog'
  hideHeader?: boolean
  className?: string
  bodyClassName?: string
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = 'dialog',
  hideHeader = false,
  className,
  bodyClassName,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-[#0B0C08]/55" />
        <Dialog.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto border-t border-rule bg-surface px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4 outline-none',
            'rounded-t-sheet md:inset-0 md:m-auto md:h-fit md:max-h-[90dvh] md:w-[560px] md:rounded-sheet md:border md:px-6 md:pb-6 md:pt-5',
            variant === 'sheet' ? 'sheet-panel' : 'dialog-panel',
            className,
          )}
        >
          {hideHeader ? (
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
          ) : (
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-1.5">
                <Dialog.Title className="font-display text-[24px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
                  {title}
                </Dialog.Title>
                {description && (
                  <Dialog.Description className="max-w-[42ch] text-[13px] leading-relaxed text-muted">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Cerrar" className="-mr-1 -mt-1">
                  <X size={18} weight="bold" />
                </Button>
              </Dialog.Close>
            </div>
          )}
          <div className={cn(hideHeader ? undefined : 'mt-5', bodyClassName)}>{children}</div>
          {footer && <div className="mt-6 border-t border-rule pt-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
