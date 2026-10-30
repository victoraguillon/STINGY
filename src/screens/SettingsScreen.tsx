import {
  ArrowClockwise,
  ArrowSquareOut,
  Check,
  Copy,
  DownloadSimple,
  PencilSimple,
  Plus,
  TelegramLogo,
  Trash,
} from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useSession } from '../app/session'
import { useTheme } from '../app/theme'
import { useToast } from '../app/toast'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { SectionHeader } from '../components/SectionHeader'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Field } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { Segmented } from '../components/ui/Segmented'
import { activeCategories, activeTransactions } from '../db/db'
import { isDefaultCategory } from '../db/defaults'
import { removeCategory, saveCategory } from '../db/repo'
import type {
  Category,
  CategoryIcon,
  Currency,
  Profile,
  RateType,
  TxKind,
} from '../db/types'
import { useRates } from '../hooks/useRates'
import { TELEGRAM_BOT_USERNAME, telegramDeepLink, useTelegram } from '../hooks/useTelegram'
import { cn } from '../lib/cn'
import { shortDay } from '../lib/dates'
import { exportCsv, exportJson } from '../lib/export'
import { formatRate, initials } from '../lib/format'
import { RATE_LABEL } from '../lib/fx'
import { newId } from '../lib/id'
import { refreshRates } from '../lib/rates'
import { syncPhaseLabel, useSyncStatus } from '../sync/engine'

const ICON_OPTIONS: Array<{ value: CategoryIcon; label: string }> = [
  { value: 'food', label: 'Comida' },
  { value: 'transport', label: 'Transporte' },
  { value: 'home', label: 'Hogar' },
  { value: 'services', label: 'Servicios' },
  { value: 'health', label: 'Salud' },
  { value: 'fun', label: 'Ocio' },
  { value: 'shopping', label: 'Compras' },
  { value: 'pets', label: 'Mascotas' },
  { value: 'salary', label: 'Sueldo' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'sales', label: 'Ventas' },
  { value: 'other', label: 'Otros' },
]

function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-card border border-rule bg-surface p-5 md:p-6', className)}>
      {children}
    </div>
  )
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">{children}</p>
  )
}

export function SettingsScreen({ profile }: { profile: Profile }) {
  const { push } = useToast()
  const { choice, setChoice } = useTheme()
  const { userId, updateProfile, signOut, exitDemo, deleteAccount, refreshSync } = useSession()
  const rates = useRates()
  const sync = useSyncStatus()
  const telegram = useTelegram(profile, userId)

  const [name, setName] = useState(profile.name)
  const [baseCurrency, setBaseCurrency] = useState<Currency>(profile.baseCurrency)
  const [rateType, setRateType] = useState<RateType>(profile.defaultRateType)
  const [savingAccount, setSavingAccount] = useState(false)
  const [refreshingRates, setRefreshingRates] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [categoryKind, setCategoryKind] = useState<TxKind>('expense')
  const [categoryModal, setCategoryModal] = useState<{
    mode: 'create' | 'edit'
    category?: Category
  } | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftIcon, setDraftIcon] = useState<CategoryIcon>('other')
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [categorySaving, setCategorySaving] = useState(false)

  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false)
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const categories =
    useLiveQuery(() => activeCategories(profile.ledgerId), [profile.ledgerId]) ?? []

  const transactions =
    useLiveQuery(() => activeTransactions(profile.ledgerId), [profile.ledgerId]) ?? []

  const usage = useMemo(() => {
    const map = new Map<string, number>()
    for (const tx of transactions) {
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + 1)
    }
    return map
  }, [transactions])

  const visibleCategories = categories.filter((category) => category.kind === categoryKind)

  useEffect(() => {
    setName(profile.name)
    setBaseCurrency(profile.baseCurrency)
    setRateType(profile.defaultRateType)
  }, [profile.name, profile.baseCurrency, profile.defaultRateType])

  const dirty =
    name.trim() !== profile.name ||
    baseCurrency !== profile.baseCurrency ||
    rateType !== profile.defaultRateType

  async function saveAccount(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length < 2) {
      push('El nombre necesita al menos dos letras.')
      return
    }
    setSavingAccount(true)
    try {
      await updateProfile({
        name: name.trim(),
        baseCurrency,
        defaultRateType: rateType,
      })
      push(
        navigator.onLine
          ? 'Cuenta actualizada.'
          : 'Guardado aquí. Se sincroniza cuando vuelvas a tener conexión.',
      )
    } catch {
      push('No se pudo guardar el perfil.')
    } finally {
      setSavingAccount(false)
    }
  }

  function openCreate() {
    setDraftName('')
    setDraftIcon('other')
    setCategoryError(null)
    setCategoryModal({ mode: 'create' })
  }

  function openEdit(category: Category) {
    setDraftName(category.name)
    setDraftIcon(category.icon)
    setCategoryError(null)
    setCategoryModal({ mode: 'edit', category })
  }

  async function saveCategoryDraft() {
    const clean = draftName.trim()
    if (clean.length < 2) {
      setCategoryError('Escribe un nombre de al menos dos letras.')
      return
    }
    const duplicate = categories.some(
      (entry) =>
        entry.kind === categoryKind &&
        entry.id !== categoryModal?.category?.id &&
        entry.name.toLowerCase() === clean.toLowerCase(),
    )
    if (duplicate) {
      setCategoryError('Ya existe una categoría con ese nombre.')
      return
    }
    setCategorySaving(true)
    try {
      if (categoryModal?.mode === 'edit' && categoryModal.category) {
        await saveCategory(
          { ...categoryModal.category, name: clean, icon: draftIcon },
          profile.id,
          profile.demo,
        )
        push('Categoría actualizada.')
      } else {
        const maxOrder = Math.max(
          0,
          ...categories
            .filter((entry) => entry.kind === categoryKind)
            .map((entry) => entry.order),
        )
        await saveCategory(
          {
            id: newId(),
            ledgerId: profile.ledgerId,
            name: clean,
            icon: draftIcon,
            kind: categoryKind,
            order: maxOrder + 1,
            createdAt: new Date().toISOString(),
          },
          profile.id,
          profile.demo,
        )
        push('Categoría agregada.')
      }
      setCategoryModal(null)
    } catch {
      setCategoryError('No se pudo guardar la categoría.')
    } finally {
      setCategorySaving(false)
    }
  }

  async function deleteCategory() {
    if (!categoryToDelete) return
    try {
      await removeCategory(categoryToDelete, profile.id, profile.demo)
      push('Categoría borrada.')
    } catch {
      push('No se pudo borrar la categoría.')
    }
    setCategoryToDelete(null)
  }

  async function handleRateRefresh() {
    setRefreshingRates(true)
    const ok = await refreshRates()
    setRefreshingRates(false)
    push(
      ok
        ? 'Tasas actualizadas.'
        : 'No se pudieron actualizar. Se muestran las últimas tasas guardadas.',
    )
  }

  async function handleSync() {
    setSyncing(true)
    await refreshSync()
    setSyncing(false)
  }

  async function handleSignOut() {
    await signOut()
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount()
      push('Cuenta borrada.')
    } catch (caught) {
      push(caught instanceof Error ? caught.message : 'No se pudo borrar la cuenta.')
    }
  }

  function copyGrammar() {
    const text = 'Mercado 12511 bolivares bcv\n+Freelance 110 dolares paralelo'
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    })
  }

  function copyCode() {
    if (!telegram.code) return
    void navigator.clipboard.writeText(telegram.code).then(() => {
      setCodeCopied(true)
      window.setTimeout(() => setCodeCopied(false), 2200)
    })
  }

  async function handleConnect() {
    try {
      await telegram.createCode()
    } catch (caught) {
      push(caught instanceof Error ? caught.message : 'No se pudo generar el código.')
    }
  }

  async function handleDisconnectTelegram() {
    try {
      await telegram.disconnect()
      push('Telegram desvinculado.')
    } catch (caught) {
      push(caught instanceof Error ? caught.message : 'No se pudo desvincular Telegram.')
    }
  }

  const telegramMeta =
    telegram.status === 'connected'
      ? telegram.link?.username
        ? `@${telegram.link.username}`
        : 'Vinculado'
      : telegram.status === 'waiting'
        ? 'Esperando'
        : telegram.status === 'loading'
          ? 'Consultando'
          : telegram.status === 'offline'
            ? 'Sin verificar'
            : telegram.status === 'error'
              ? 'Error'
              : telegram.status === 'unavailable'
                ? 'No disponible'
                : 'No conectado'

  return (
    <div className="flex flex-col gap-10 pb-4 md:gap-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            Tu cuenta y tu libro
          </p>
          <h1 className="mt-1 font-display text-[34px] font-semibold leading-[0.95] tracking-[-0.045em] text-ink md:text-[42px]">
            Ajustes
          </h1>
          <p className="mt-2 max-w-[52ch] text-[12px] leading-relaxed text-muted md:text-[13px]">
            {profile.demo
              ? 'Estás viendo datos de ejemplo. Viven solo en este dispositivo y no tocan ninguna cuenta real.'
              : 'Tus cambios se guardan solos y se sincronizan cuando hay conexión.'}
          </p>
        </div>
        <div className="hidden items-center gap-2.5 md:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20 bg-surface font-mono text-[11px] font-medium text-ink">
            {initials(profile.name)}
          </span>
          <div className="leading-tight">
            <p className="text-[13px] text-ink">{profile.name}</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              {profile.demo ? 'Perfil de ejemplo' : 'Cuenta personal'}
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="cuenta">
        <SectionHeader index="01" title="Cuenta" meta={profile.demo ? 'Ejemplo' : 'Personal'} />
        <form className="mt-4 flex flex-col gap-5" onSubmit={saveAccount}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={60}
            />
            <Field
              label="Correo"
              type="email"
              value={profile.email}
              readOnly
              hint="El correo es tu identidad de acceso. Cambiarlo llega con la verificación por correo."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Moneda base
              </span>
              <Segmented
                options={[
                  { value: 'VES', label: 'Bolívares' },
                  { value: 'USD', label: 'Dólares' },
                ]}
                value={baseCurrency}
                onChange={setBaseCurrency}
                label="Moneda base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                Tasa por defecto
              </span>
              <Segmented
                options={[
                  { value: 'bcv', label: 'BCV' },
                  { value: 'paralelo', label: 'Paralelo' },
                ]}
                value={rateType}
                onChange={setRateType}
                label="Tasa por defecto"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
            <p className="max-w-[52ch] text-[11px] leading-relaxed text-muted">
              {profile.demo
                ? 'Este perfil de ejemplo no se sincroniza. Para tener una cuenta real, sal del ejemplo y crea una.'
                : 'Nombre, moneda y tasa por defecto se aplican a todo el libro.'}
            </p>
            <Button type="submit" variant="primary" loading={savingAccount} disabled={!dirty}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="apariencia">
        <SectionHeader index="02" title="Apariencia" meta="Tema" />
        <Card className="mt-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[46ch]">
              <Kicker>Claro, oscuro o como el sistema</Kicker>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                El tema oscuro usa grafito, no negro puro. Los acentos se mantienen
                legibles y el recibo conserva su borde perforado.
              </p>
            </div>
            <Segmented
              className="md:w-[320px]"
              options={[
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Oscuro' },
                { value: 'system', label: 'Sistema' },
              ]}
              value={choice}
              onChange={setChoice}
              label="Tema de la interfaz"
            />
          </div>
        </Card>
      </section>

      <section aria-labelledby="tasas">
        <SectionHeader index="03" title="Tasas" meta="Referencia" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(['bcv', 'paralelo'] as RateType[]).map((type) => {
            const rate = rates[type]
            return (
              <Card key={type} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Kicker>{RATE_LABEL[type]}</Kicker>
                    <p className="mt-1 font-mono text-[24px] leading-none tracking-[-0.03em] tabular-nums text-ink">
                      {formatRate(rate.value)}
                    </p>
                  </div>
                  <span className="rounded-full border border-rule px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                    Bs / $
                  </span>
                </div>
                <p className="font-mono text-[9px] uppercase leading-relaxed tracking-[0.08em] text-muted">
                  {rate.source} · {shortDay(rate.date)}
                </p>
              </Card>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[68ch] text-[11px] leading-relaxed text-muted">
            Cada movimiento guarda la tasa con la que se anotó, así que cambiar la tasa por
            defecto no reescribe el pasado. La app busca tasas nuevas al abrir y cada seis
            horas si hay conexión.
          </p>
          <Button
            size="sm"
            variant="secondary"
            loading={refreshingRates}
            onClick={() => {
              void handleRateRefresh()
            }}
          >
            <ArrowClockwise size={13} weight="bold" />
            Actualizar
          </Button>
        </div>
      </section>

      <section aria-labelledby="categorias">
        <SectionHeader
          index="04"
          title="Categorías"
          meta={`${visibleCategories.length} ${visibleCategories.length === 1 ? 'categoría' : 'categorías'}`}
          action={
            <Button size="sm" variant="secondary" onClick={openCreate}>
              <Plus size={13} weight="bold" />
              Agregar
            </Button>
          }
        />
        <div className="mt-4">
          <Segmented
            className="w-[236px]"
            options={[
              { value: 'expense', label: 'Gastos' },
              { value: 'income', label: 'Ingresos' },
            ]}
            value={categoryKind}
            onChange={setCategoryKind}
            label="Tipo de categoría"
            size="sm"
          />
          <div className="mt-4 border-t border-rule">
            {visibleCategories.map((category) => {
              const used = usage.get(category.id) ?? 0
              const isDefault = isDefaultCategory(category)
              return (
                <div
                  key={category.id}
                  className="flex items-center gap-3 border-b border-rule py-2.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rule bg-paper-2 text-ink-2">
                    <CategoryGlyph icon={category.icon} size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-ink">{category.name}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                      {used} {used === 1 ? 'movimiento' : 'movimientos'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    aria-label={`Renombrar ${category.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-btn text-muted transition-colors hover:bg-paper-2 hover:text-ink md:h-8 md:w-8"
                  >
                    <PencilSimple size={15} weight="bold" />
                  </button>
                  <button
                    type="button"
                    disabled={isDefault}
                    onClick={() => {
                      if (isDefault) return
                      if (used > 0) {
                        push(
                          `“${category.name}” tiene ${used} ${used === 1 ? 'movimiento' : 'movimientos'}. Renómbrala o muévelos antes de borrarla.`,
                        )
                        return
                      }
                      setCategoryToDelete(category)
                    }}
                    aria-label={
                      isDefault
                        ? `${category.name} es predeterminada y no se puede borrar`
                        : `Borrar ${category.name}`
                    }
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-btn transition-colors md:h-8 md:w-8',
                      isDefault
                        ? 'cursor-not-allowed text-muted/35'
                        : 'text-muted hover:bg-tomato/10 hover:text-tomato-text',
                    )}
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Las categorías predeterminadas no se borran para que los reportes históricos
            sigan teniendo sentido. Las que crees tú sí, siempre que no tengan
            movimientos.
          </p>
        </div>
      </section>

      <section aria-labelledby="telegram">
        <SectionHeader index="05" title="Telegram" meta={telegramMeta} />
        <Card className="mt-4">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-rule bg-paper-2 text-ink-2">
                  <TelegramLogo size={17} weight="bold" />
                </span>
                <div>
                  <p className="font-display text-[19px] font-semibold leading-none tracking-[-0.03em] text-ink">
                    Anota desde el chat
                  </p>
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                    @{TELEGRAM_BOT_USERNAME}
                  </p>
                </div>
              </div>

              <p className="mt-4 max-w-[48ch] text-[13px] leading-relaxed text-ink-2">
                {profile.demo
                  ? 'El modo ejemplo no incluye conexión al bot. Vincula una cuenta real desde Ajustes.'
                  : 'Una línea, sin emojis, con la tasa al final. El bot usa tu libro y tus categorías, y anota en la zona horaria de Caracas.'}
              </p>

              <div className="mt-4 flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed text-ink-2">
                <code className="border-l-2 border-rule pl-2.5">Mercado 12511 bolivares bcv</code>
                <code className="border-l-2 border-rule pl-2.5">+Freelance 110 dolares paralelo</code>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={copyGrammar}
                  aria-live="polite"
                >
                  {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
                  {copied ? 'Copiado' : 'Copiar ejemplos'}
                </Button>
                {telegram.available &&
                  (telegram.status === 'connected' ? (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={telegram.busy}
                      onClick={() => {
                        void handleDisconnectTelegram()
                      }}
                    >
                      Desvincular
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      loading={telegram.busy}
                      disabled={telegram.status === 'offline'}
                      onClick={() => {
                        void handleConnect()
                      }}
                    >
                      {telegram.status === 'waiting' ? 'Nuevo código' : 'Generar código'}
                    </Button>
                  ))}
              </div>
            </div>

            <div className="rounded-btn border border-rule bg-paper p-3">
              <div className="flex items-center justify-between border-b border-rule pb-2">
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                  @{TELEGRAM_BOT_USERNAME}
                </span>
                <span
                  className={cn(
                    'rounded-full border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em]',
                    telegram.status === 'connected'
                      ? 'border-lime bg-lime/15 text-ink'
                      : 'border-rule text-muted',
                  )}
                >
                  {telegram.status === 'connected' ? 'Conectado' : telegramMeta}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2.5">
                {telegram.status === 'unavailable' && (
                  <p className="text-[11px] leading-relaxed text-ink-2">
                    Disponible solo en cuentas reales.
                  </p>
                )}

                {telegram.status === 'offline' && (
                  <p className="text-[11px] leading-relaxed text-ink-2">
                    Sin conexión no puedo verificar el vínculo. Vuelve a intentar cuando
                    tengas red.
                  </p>
                )}

                {telegram.status === 'loading' && (
                  <p className="text-[11px] leading-relaxed text-muted" aria-live="polite">
                    Consultando el vínculo…
                  </p>
                )}

                {telegram.status === 'error' && (
                  <>
                    <p className="text-[11px] leading-relaxed text-tomato-text">
                      {telegram.error ?? 'No pude verificar el vínculo.'}
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void telegram.refresh()
                      }}
                    >
                      Reintentar
                    </Button>
                  </>
                )}

                {telegram.status === 'disconnected' && (
                  <p className="text-[11px] leading-relaxed text-ink-2">
                    Genera un código de un solo uso, ábrelo en Telegram y envía{' '}
                    <code className="font-mono text-[10px] text-ink">/start CODIGO</code>.
                    El código vence en 10 minutos.
                  </p>
                )}

                {telegram.status === 'waiting' && telegram.code && (
                  <>
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
                      Tu código
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex-1 rounded-btn border border-ink/20 bg-surface px-3 py-2 font-mono text-[20px] tracking-[0.16em] text-ink">
                        {telegram.code}
                      </span>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={copyCode}
                        aria-label="Copiar código"
                      >
                        {codeCopied ? (
                          <Check size={14} weight="bold" />
                        ) : (
                          <Copy size={14} weight="bold" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[10px] leading-relaxed text-muted">
                      {telegram.expiresAt
                        ? `Vence a las ${new Date(telegram.expiresAt)
                            .toLocaleTimeString('es-VE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                            .replace(/\.$/, '')}. `
                        : ''}
                      Envía /start con el código. Este panel se actualiza solo.
                    </p>
                    <a
                      href={telegramDeepLink(telegram.code)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-btn border border-ink/25 bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:border-ink/50 md:h-9"
                    >
                      Abrir Telegram
                      <ArrowSquareOut size={13} weight="bold" />
                    </a>
                  </>
                )}

                {telegram.status === 'connected' && telegram.link && (
                  <>
                    <p className="font-display text-[17px] font-semibold leading-none tracking-[-0.02em] text-ink">
                      {telegram.link.username ? `@${telegram.link.username}` : 'Chat vinculado'}
                    </p>
                    <p className="font-mono text-[10px] tabular-nums text-muted">
                      Chat {telegram.link.chatId}
                    </p>
                    <p className="text-[11px] leading-relaxed text-ink-2">
                      Vinculado el {shortDay(telegram.link.linkedAt.slice(0, 10))}. Lo que
                      anotes aquí llega a la app en la próxima sincronización.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section aria-labelledby="datos">
        <SectionHeader index="06" title="Datos" meta="Exportar y sesión" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Card className="flex flex-col gap-3">
            <Kicker>Exportar</Kicker>
            <p className="text-[13px] leading-relaxed text-ink-2">
              Llévate todo: perfil, categorías y movimientos. El JSON sirve para
              respaldar; el CSV abre en cualquier hoja de cálculo.
            </p>
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportJson({ profile, categories, transactions })}
              >
                <DownloadSimple size={13} weight="bold" />
                JSON
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => exportCsv({ profile, categories, transactions })}
              >
                <DownloadSimple size={13} weight="bold" />
                CSV
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <Kicker>{profile.demo ? 'Datos de ejemplo' : 'Sesión y sincronización'}</Kicker>
            {profile.demo ? (
              <p className="text-[13px] leading-relaxed text-ink-2">
                El ejemplo reemplaza el libro por el perfil de Ana Torres y seis meses de
                movimientos. Al salir se borra y vuelves a la pantalla de acceso.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[13px] leading-relaxed text-ink-2">
                  Estado: <span className="text-ink">{syncPhaseLabel(sync.phase)}</span>
                  {sync.lastSync ? ` · última ${shortDay(sync.lastSync.slice(0, 10))}` : ''}
                </p>
                {sync.error && (
                  <p className="text-[11px] leading-relaxed text-tomato-text">{sync.error}</p>
                )}
                <p className="text-[11px] leading-relaxed text-muted">
                  Sin conexión puedes seguir anotando. La cola se envía sola al volver la
                  red.
                </p>
              </div>
            )}
            <div className="mt-auto flex flex-wrap gap-2 pt-2">
              {profile.demo ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    void exitDemo()
                  }}
                >
                  Salir del ejemplo
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={syncing}
                    onClick={() => {
                      void handleSync()
                    }}
                  >
                    <ArrowClockwise size={13} weight="bold" />
                    Sincronizar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void handleSignOut()
                    }}
                  >
                    Cerrar sesión
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmDeleteAccount(true)}
                  >
                    <Trash size={13} weight="bold" />
                    Borrar cuenta
                  </Button>
                </>
              )}
            </div>
          </Card>
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-rule pt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
        <span>stingy</span>
      </div>

      <Modal
        open={categoryModal !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryModal(null)
        }}
        title={categoryModal?.mode === 'edit' ? 'Renombrar categoría' : 'Nueva categoría'}
        description={
          categoryKind === 'expense'
            ? 'Se usará en gastos. Puedes cambiar el icono cuando quieras.'
            : 'Se usará en ingresos. Puedes cambiar el icono cuando quieras.'
        }
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setCategoryModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              loading={categorySaving}
              onClick={() => {
                void saveCategoryDraft()
              }}
            >
              {categoryModal?.mode === 'edit' ? 'Guardar' : 'Agregar categoría'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Nombre"
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value)
              setCategoryError(null)
            }}
            maxLength={28}
            autoFocus
          />
          {categoryError && (
            <p role="alert" className="text-[12px] text-tomato-text">
              {categoryError}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Icono
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={draftIcon === option.value}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setDraftIcon(option.value)}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-btn border transition-colors md:h-9 md:w-9',
                    draftIcon === option.value
                      ? 'border-ink bg-lime text-[#15160F]'
                      : 'border-rule bg-surface-2 text-ink-2 hover:border-ink/30',
                  )}
                >
                  <CategoryGlyph icon={option.value} size={15} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={categoryToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null)
        }}
        title={
          categoryToDelete ? `¿Borrar “${categoryToDelete.name}”?` : '¿Borrar categoría?'
        }
        description="La categoría desaparece del selector. No tiene movimientos asociados."
        confirmLabel="Borrar categoría"
        onConfirm={() => {
          void deleteCategory()
        }}
      />

      <ConfirmDialog
        open={confirmDeleteAccount}
        onOpenChange={setConfirmDeleteAccount}
        title="¿Borrar tu cuenta?"
        description="Se borran tu perfil, tus categorías y todos tus movimientos en este dispositivo. No se puede deshacer."
        confirmLabel="Borrar cuenta"
        onConfirm={() => {
          void handleDeleteAccount()
        }}
      />

      <span className="sr-only">
        Cuenta de {profile.name}
      </span>
    </div>
  )
}
