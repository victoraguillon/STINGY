import * as Dialog from '@radix-ui/react-dialog'
import { Backspace, CalendarBlank, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { activeCategories } from '../db/db'
import {
  discardLocalTransaction,
  removeTransaction,
  restoreTransaction,
  saveTransaction,
} from '../db/repo'
import type { Currency, Profile, RateType, Tx, TxKind } from '../db/types'
import { useToast } from '../app/toast'
import { useRates } from '../hooks/useRates'
import { cn } from '../lib/cn'
import { relativeDay, shortDay, toDayString } from '../lib/dates'
import { formatMoney, parseAmountInput } from '../lib/format'
import { RATE_LABEL } from '../lib/fx'
import { newId } from '../lib/id'
import { CategoryGlyph } from './CategoryGlyph'
import { Money } from './Money'
import { Button } from './ui/Button'
import { Segmented } from './ui/Segmented'
import { Stamp } from './ui/Stamp'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'] as const

function rawFromAmount(amount: number) {
  return String(amount).replace('.', ',')
}

interface QuickAddSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile
  initialKind: TxKind
  editTx: Tx | null
}

export function QuickAddSheet({
  open,
  onOpenChange,
  profile,
  initialKind,
  editTx,
}: QuickAddSheetProps) {
  const { push } = useToast()
  const rates = useRates()
  const categories =
    useLiveQuery(() => activeCategories(profile.ledgerId), [profile.ledgerId]) ?? []

  const [kind, setKind] = useState<TxKind>(editTx?.kind ?? initialKind)
  const [raw, setRaw] = useState(editTx ? rawFromAmount(editTx.amount) : '')
  const [currency, setCurrency] = useState<Currency>(editTx?.currency ?? profile.baseCurrency)
  const [rateType, setRateType] = useState<RateType>(
    editTx?.rateType ?? profile.defaultRateType,
  )
  const [note, setNote] = useState(editTx?.note ?? '')
  const [categoryId, setCategoryId] = useState(editTx?.categoryId ?? '')
  const [date, setDate] = useState(editTx?.occurredOn ?? toDayString(new Date()))
  const [stamped, setStamped] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const today = useMemo(() => toDayString(new Date()), [])
  const yesterday = useMemo(() => {
    const value = new Date()
    value.setDate(value.getDate() - 1)
    return toDayString(value)
  }, [])

  const amount = parseAmountInput(raw)
  const chosenRate = rates[rateType].value
  const otherType: RateType = rateType === 'bcv' ? 'paralelo' : 'bcv'
  const otherRate = rates[otherType].value
  const amountUsd = currency === 'USD' ? amount : amount / chosenRate
  const equivalentCurrency: Currency = currency === 'VES' ? 'USD' : 'VES'
  const chosenEquivalent = currency === 'VES' ? amount / chosenRate : amount * chosenRate
  const otherEquivalent = currency === 'VES' ? amount / otherRate : amount * otherRate
  const options = categories.filter((category) => category.kind === kind)
  const category = categories.find((entry) => entry.id === categoryId)
  const isCustomDate = date !== today && date !== yesterday

  useEffect(() => {
    const first = options[0]
    if (!first) return
    if (!options.some((entry) => entry.id === categoryId)) setCategoryId(first.id)
  }, [categoryId, options])

  const press = useCallback((key: string) => {
    setError(null)
    setRaw((current) => {
      if (key === 'back') return current.slice(0, -1)
      if (key === ',') {
        if (current.includes(',')) return current
        return current === '' ? '0,' : `${current},`
      }
      if (current === '0') return key
      if (current.includes(',')) {
        const decimals = current.split(',')[1] ?? ''
        if (decimals.length >= 2) return current
      }
      if (current.replace(/,/g, '').length >= 12) return current
      return `${current}${key}`
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault()
        press(event.key)
      } else if (event.key === ',' || event.key === '.') {
        event.preventDefault()
        press(',')
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        press('back')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, press])

  async function handleSave() {
    if (amount <= 0) {
      setError('Escribe un monto mayor que cero.')
      return
    }
    if (!categoryId) {
      setError('Elige una categoría.')
      return
    }
    setError(null)
    setSaving(true)
    setStamped(true)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    await new Promise<void>((resolve) => window.setTimeout(resolve, reduced ? 0 : 280))
    const now = new Date().toISOString()
    const base = {
      ledgerId: profile.ledgerId,
      createdBy: profile.id,
      kind,
      amount,
      currency,
      rateType,
      rate: chosenRate,
      amountUsd,
      categoryId,
      note: note.trim() || category?.name || 'Movimiento',
      occurredOn: date,
    }

    if (editTx) {
      await saveTransaction({ ...editTx, ...base })
      push('Cambios guardados.', {
        label: 'Deshacer',
        onClick: () => {
          void saveTransaction(editTx)
        },
      })
    } else {
      const created: Tx = {
        ...base,
        id: newId(),
        source: 'web',
        createdAt: now,
        updatedAt: now,
      }
      await saveTransaction(created)
      push(kind === 'expense' ? 'Anotado. Ese real no se escapa.' : 'Anotado. Ese real sí entró.', {
        label: 'Deshacer',
        onClick: () => {
          void discardLocalTransaction(created)
        },
      })
    }
    setSaving(false)
    onOpenChange(false)
  }

  async function handleDelete() {
    if (!editTx) return
    await removeTransaction(editTx)
    onOpenChange(false)
    push('Movimiento borrado.', {
      label: 'Deshacer',
      onClick: () => {
        void restoreTransaction(editTx)
      },
    })
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-anim fixed inset-0 z-50 bg-[#0B0C08]/55" />
        <Dialog.Content
          className="sheet-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto rounded-t-sheet border-t border-rule bg-surface pb-[calc(16px+env(safe-area-inset-bottom))] outline-none md:inset-0 md:m-auto md:h-fit md:max-h-[90dvh] md:w-[880px] md:rounded-sheet md:border md:pb-0"
          aria-describedby="quick-add-description"
        >
          <div className="mx-auto mb-1 mt-2.5 h-1 w-9 rounded-full bg-rule md:hidden" />
          <div className="flex items-start justify-between px-5 pt-2 md:px-6 md:pt-5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                {editTx ? 'Editar movimiento' : 'Nuevo movimiento'}
              </p>
              <Dialog.Title className="mt-0.5 font-display text-[18px] font-semibold leading-none tracking-[-0.03em] text-ink">
                {kind === 'expense' ? 'Gasto' : 'Ingreso'}
              </Dialog.Title>
              <Dialog.Description id="quick-add-description" className="sr-only">
                Registra un ingreso o gasto. El monto se convierte con las tasas BCV y
                paralelo.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar" className="-mr-1 -mt-1">
                <X size={18} weight="bold" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-4 grid flex-1 grid-cols-1 gap-4 px-5 pb-5 md:mt-5 md:grid-cols-2 md:items-start md:gap-x-8 md:gap-y-5 md:px-6 md:pb-6">
            <div className="relative rounded-ticket border-[1.5px] border-ink/20 bg-paper px-4 pb-7 pt-3.5 md:col-start-2 md:row-start-1">
              <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                <span>{editTx ? 'Editando' : 'Nuevo movimiento'}</span>
                <span>{kind === 'expense' ? 'Gasto' : 'Ingreso'}</span>
              </div>

              <label
                htmlFor="tx-note"
                className="mt-4 block font-mono text-[9px] uppercase tracking-[0.14em] text-muted"
              >
                Concepto
              </label>
              <input
                id="tx-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={60}
                autoComplete="off"
                placeholder={category?.name ?? 'Mercado, café, pasaje'}
                className="mt-0.5 w-full bg-transparent font-display text-[20px] font-semibold leading-tight tracking-[-0.03em] text-ink outline-none placeholder:font-sans placeholder:text-[14px] placeholder:font-normal placeholder:text-muted/70"
              />

              <div className="mt-2">
                <Money
                  value={amount}
                  currency={currency}
                  prefixClassName="text-ink/55"
                  className="text-[36px] md:text-[40px]"
                />
              </div>

              <div className="mt-2 min-h-[30px] font-mono text-[11px] leading-[1.5] tabular-nums">
                {amount > 0 ? (
                  <>
                    <p className="text-ink-2">
                      {formatMoney(chosenEquivalent, equivalentCurrency)} ·{' '}
                      {RATE_LABEL[rateType]}
                    </p>
                    <p className="text-muted">
                      {formatMoney(otherEquivalent, equivalentCurrency)} ·{' '}
                      {RATE_LABEL[otherType]}
                    </p>
                  </>
                ) : (
                  <p className="font-sans text-[11px] text-muted">
                    Escribe el monto con el teclado.
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-rule pt-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                <span className="truncate">
                  {category?.name ?? 'Sin categoría'} · {relativeDay(date, new Date())}
                </span>
                <span>{currency === 'VES' ? 'Bolívares' : 'Dólares'}</span>
              </div>

              <div className="receipt-tear" style={{ '--tear': 'var(--surface)' } as CSSProperties} />

              {stamped && (
                <div className="absolute right-3 top-[68px] z-10">
                  <Stamp label={editTx ? 'Cambiado' : 'Anotado'} tone="lime" animate />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 md:col-start-1 md:row-span-2 md:row-start-1">
              <Segmented
                options={[
                  { value: 'expense', label: 'Gasto' },
                  { value: 'income', label: 'Ingreso' },
                ]}
                value={kind}
                onChange={(next) => {
                  setKind(next)
                  setError(null)
                }}
                label="Tipo de movimiento"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    Moneda
                  </span>
                  <Segmented
                    options={[
                      { value: 'VES', label: 'Bs' },
                      { value: 'USD', label: '$' },
                    ]}
                    value={currency}
                    onChange={setCurrency}
                    label="Moneda del monto"
                    size="sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                    Tasa
                  </span>
                  <Segmented
                    options={[
                      { value: 'bcv', label: 'BCV' },
                      { value: 'paralelo', label: 'Paralelo' },
                    ]}
                    value={rateType}
                    onChange={setRateType}
                    label="Tasa aplicada"
                    size="sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  Categoría
                </span>
                <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
                  {options.map((option) => {
                    const active = option.id === categoryId
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCategoryId(option.id)}
                        className={cn(
                          'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors md:h-8',
                          active
                            ? 'border-ink bg-lime text-[#15160F]'
                            : 'border-rule bg-surface-2 text-ink-2 hover:border-ink/30',
                        )}
                      >
                        <CategoryGlyph icon={option.icon} size={13} />
                        {option.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  Fecha
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate(today)}
                    aria-pressed={date === today}
                    className={cn(
                      'inline-flex h-11 items-center rounded-full border px-3 text-[12px] transition-colors md:h-8',
                      date === today
                        ? 'border-ink bg-lime text-[#15160F]'
                        : 'border-rule bg-surface-2 text-ink-2 hover:border-ink/30',
                    )}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(yesterday)}
                    aria-pressed={date === yesterday}
                    className={cn(
                      'inline-flex h-11 items-center rounded-full border px-3 text-[12px] transition-colors md:h-8',
                      date === yesterday
                        ? 'border-ink bg-lime text-[#15160F]'
                        : 'border-rule bg-surface-2 text-ink-2 hover:border-ink/30',
                    )}
                  >
                    Ayer
                  </button>
                  <label
                    className={cn(
                      'relative inline-flex h-11 cursor-pointer items-center gap-1.5 overflow-hidden rounded-full border px-3 text-[12px] transition-colors md:h-8',
                      isCustomDate
                        ? 'border-ink bg-lime text-[#15160F]'
                        : 'border-rule bg-surface-2 text-ink-2 hover:border-ink/30',
                    )}
                  >
                    <CalendarBlank size={13} weight="bold" />
                    <span>{isCustomDate ? shortDay(date) : 'Otro'}</span>
                    <input
                      type="date"
                      value={date}
                      max={today}
                      onChange={(event) => {
                        if (event.target.value) setDate(event.target.value)
                      }}
                      aria-label="Elegir otra fecha"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>

              {editTx && (
                <div className="mt-1 border-t border-rule pt-3">
                  {confirmingDelete ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[12px] text-ink-2">¿Borrar este movimiento?</p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmingDelete(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="border-transparent bg-tomato-text text-white hover:bg-[#a7381c]"
                          onClick={() => {
                            void handleDelete()
                          }}
                        >
                          Borrar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="tap-link text-[12px] text-tomato-text underline decoration-tomato-text/40 underline-offset-[3px] hover:decoration-tomato-text"
                    >
                      Borrar movimiento
                    </button>
                  )}
                </div>
              )}

              <p className="hidden font-mono text-[9px] uppercase leading-relaxed tracking-[0.1em] text-muted md:block">
                {profile.demo
                  ? 'También puedes escribir el monto con el teclado. Los datos de ejemplo viven solo en este dispositivo.'
                  : 'También puedes escribir el monto con el teclado. Se guarda aquí y se sincroniza cuando hay conexión.'}
              </p>
            </div>

            <div className="md:col-start-2 md:row-start-2">
              <div
                className="grid grid-cols-3 gap-1.5"
                role="group"
                aria-label="Teclado numérico"
              >
                {KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => press(key)}
                    aria-label={key === 'back' ? 'Borrar último dígito' : key}
                    className="flex h-11 items-center justify-center rounded-[10px] border border-rule/70 bg-surface-2 font-mono text-[17px] font-medium text-ink transition-colors hover:border-ink/25 hover:bg-paper-2 active:bg-rule/60"
                  >
                    {key === 'back' ? <Backspace size={17} weight="bold" /> : key}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-start-2 md:row-start-3">
              <Button
                size="lg"
                variant="primary"
                className="w-full"
                onClick={() => {
                  void handleSave()
                }}
                disabled={amount <= 0 || categories.length === 0}
                loading={saving}
              >
                {editTx
                  ? 'Guardar cambios'
                  : kind === 'expense'
                    ? 'Anotar gasto'
                    : 'Anotar ingreso'}
              </Button>
              {error && (
                <p role="alert" className="text-[12px] text-tomato-text">
                  {error}
                </p>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
