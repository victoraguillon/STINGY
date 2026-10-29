import {
  Check,
  Plus,
  Ruler,
  X,
} from '@phosphor-icons/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuickAdd } from '../app/quick-add'
import { BrandLockup, CoinMark } from '../components/Brand'
import { CategoryGlyph } from '../components/CategoryGlyph'
import { Money } from '../components/Money'
import { MonthlyReceipt } from '../components/MonthlyReceipt'
import { SectionHeader } from '../components/SectionHeader'
import { TransactionRow } from '../components/TransactionRow'
import { CategoryBars } from '../components/charts/CategoryBars'
import { DailyBars } from '../components/charts/DailyBars'
import { DivergingBars } from '../components/charts/DivergingBars'
import { Heatmap } from '../components/charts/Heatmap'
import { Sparkline } from '../components/charts/Sparkline'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { Segmented } from '../components/ui/Segmented'
import { Stamp } from '../components/ui/Stamp'
import type { Category, CategoryIcon, Profile, Tx } from '../db/types'
import { cn } from '../lib/cn'
import { formatRate } from '../lib/format'
import { rateValue } from '../lib/fx'

const COLORS: Array<{
  token: string
  role: string
  light: string
  dark: string
  variable: string
  onDark?: boolean
}> = [
  {
    token: 'paper',
    role: 'Fondo de la aplicación',
    light: '#F3F1EA',
    dark: '#10120E',
    variable: '--paper',
  },
  {
    token: 'surface',
    role: 'Recibos, hojas, tarjetas',
    light: '#FBF9F3',
    dark: '#171A14',
    variable: '--surface',
  },
  {
    token: 'paper-2',
    role: 'Relleno tranquilo, chips',
    light: '#EAE7DC',
    dark: '#171A14',
    variable: '--paper-2',
  },
  {
    token: 'ink',
    role: 'Texto principal y sellos',
    light: '#15160F',
    dark: '#F2F0E6',
    variable: '--ink',
    onDark: true,
  },
  {
    token: 'muted',
    role: 'Texto secundario',
    light: '#6A6B61',
    dark: '#9A9C8F',
    variable: '--muted',
    onDark: true,
  },
  {
    token: 'rule',
    role: 'Líneas de 1px',
    light: '#D8D4C6',
    dark: '#2C3026',
    variable: '--rule',
  },
  {
    token: 'lime',
    role: 'Acción primaria y sello',
    light: '#CBE84F',
    dark: '#CBE84F',
    variable: '--lime',
  },
  {
    token: 'tomato',
    role: 'Gasto y error',
    light: '#D9502F',
    dark: '#FF6B47',
    variable: '--tomato',
    onDark: true,
  },
  {
    token: 'cobalt',
    role: 'Dato y variación de tasa',
    light: '#2547D8',
    dark: '#8FA0FF',
    variable: '--cobalt',
    onDark: true,
  },
]

const SECTION_LINKS = [
  ['fundamento', 'Fundamento'],
  ['paleta', 'Paleta'],
  ['tipografia', 'Tipografía'],
  ['forma', 'Forma'],
  ['componentes', 'Componentes'],
  ['graficas', 'Gráficas'],
  ['recibo', 'Recibo'],
  ['movimiento', 'Movimiento'],
  ['voz', 'Voz'],
  ['anti-slop', 'Anti-plantilla'],
] as const

const ICON_SHOWCASE: CategoryIcon[] = [
  'food',
  'transport',
  'home',
  'services',
  'health',
  'fun',
  'shopping',
  'pets',
  'salary',
  'freelance',
  'sales',
  'other',
]

const SAMPLE_DAYS = Array.from({ length: 28 }, (_, index) => {
  const day = index + 1
  const base = [0, 0, 4200, 1250, 0, 7600, 3100, 0, 1850, 4800][index % 10] ?? 0
  return {
    date: `2026-10-${String(day).padStart(2, '0')}`,
    value: index === 23 ? 11400 : base,
  }
})

const SAMPLE_MONTHS = [
  { label: 'Mayo', income: 470, expense: 402, net: 68 },
  { label: 'Junio', income: 505, expense: 431, net: 74 },
  { label: 'Julio', income: 498, expense: 468, net: 30 },
  { label: 'Agosto', income: 540, expense: 421, net: 119 },
  { label: 'Septiembre', income: 522, expense: 455, net: 67 },
  { label: 'Octubre', income: 560, expense: 441, net: 119 },
].map((entry, index) => ({
  date: new Date(2026, 4 + index, 1),
  income: entry.income,
  expense: entry.expense,
  net: entry.net,
}))

const SAMPLE_CATEGORIES: Category[] = [
  { id: 'cat_food', ledgerId: 'ledger_personal', name: 'Comida', icon: 'food', kind: 'expense', order: 1 },
  { id: 'cat_home', ledgerId: 'ledger_personal', name: 'Hogar', icon: 'home', kind: 'expense', order: 3 },
  { id: 'cat_transport', ledgerId: 'ledger_personal', name: 'Transporte', icon: 'transport', kind: 'expense', order: 2 },
  { id: 'cat_services', ledgerId: 'ledger_personal', name: 'Servicios', icon: 'services', kind: 'expense', order: 4 },
]

const SAMPLE_SLICES = [
  { category: SAMPLE_CATEGORIES[0]!, value: 189.4, share: 42.9 },
  { category: SAMPLE_CATEGORIES[1]!, value: 120, share: 27.2 },
  { category: SAMPLE_CATEGORIES[2]!, value: 72.6, share: 16.4 },
  { category: SAMPLE_CATEGORIES[3]!, value: 59.4, share: 13.5 },
]

const SAMPLE_TX: Tx = {
  id: 'tx_sample',
  ledgerId: 'ledger_personal',
  createdBy: 'me',
  kind: 'expense',
  amount: 12511,
  currency: 'VES',
  rateType: 'bcv',
  rate: rateValue('bcv'),
  amountUsd: 12511 / rateValue('bcv'),
  categoryId: 'cat_food',
  note: 'Mercado',
  occurredOn: '2026-10-26',
  source: 'telegram',
  createdAt: '2026-10-26T10:24:00.000Z',
}

const SAMPLE_HEAT = (() => {
  const map = new Map<string, number>()
  for (let day = 1; day <= 27; day += 1) {
    const value = [0, 1850, 0, 4200, 7600, 0, 1250, 3100, 11400][day % 9] ?? 0
    map.set(`2026-10-${String(day).padStart(2, '0')}`, value)
  }
  return map
})()

const SAMPLE_TOTALS = {
  incomeUsd: 560,
  expenseUsd: 441.4,
  netUsd: 118.6,
  incomeVes: 496287.18,
  expenseVes: 398746.12,
  netVes: 97541.06,
}

function Panel({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={cn('border border-rule bg-surface', className)}>
      {label && (
        <div className="border-b border-rule px-4 py-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted">
          {label}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </div>
  )
}

function SpecRow({
  name,
  value,
  children,
}: {
  name: string
  value: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-2.5 last:border-b-0">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-ink-2">{name}</span>
      <span className="font-mono text-[9px] tabular-nums text-muted">{value}</span>
      {children && <div className="w-full pt-1">{children}</div>}
    </div>
  )
}

function Rule({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3 border-t border-rule py-3.5 first:border-t-0 first:pt-0">
      <Check size={14} weight="bold" className="mt-0.5 shrink-0 text-ink" aria-hidden="true" />
      <p className="text-[12.5px] leading-relaxed text-ink-2">
        <span className="font-medium text-ink">{title}.</span> {children}
      </p>
    </div>
  )
}

export function DesignSystemScreen({ profile }: { profile: Profile }) {
  const { open } = useQuickAdd()
  const [stampKey, setStampKey] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [segmented, setSegmented] = useState<'week' | 'month' | 'year'>('month')
  const heatMonth = useMemo(() => new Date(2026, 9, 1), [])

  return (
    <div className="flex flex-col gap-12 pb-8 md:gap-16">
      <header>
        <div className="flex items-center justify-between gap-4 border-b border-rule pb-4">
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex">
              <BrandLockup coinSize={20} textClassName="text-[19px]" />
            </span>
            <span className="hidden h-4 w-px bg-rule md:block" aria-hidden="true" />
            <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
              Sistema de diseño
            </span>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
            v0.1
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              El recibo vivo · Editorial sobrio
            </p>
            <h1 className="mt-3 font-display text-[clamp(40px,6.2vw,72px)] font-semibold leading-[0.92] tracking-[-0.055em] text-ink">
              Un recibo,
              <br />
              no un tablero.
            </h1>
            <p className="mt-5 max-w-[62ch] text-[14px] leading-relaxed text-ink-2 md:text-[15px]">
              stingy se lee como el papel que sí importa: cifras alineadas, líneas finas y
              un sello que confirma. La interfaz desaparece; el número y su contexto se
              quedan. Esta página documenta las piezas reales, no una maqueta aparte.
            </p>
          </div>
          <div className="lg:col-span-4">
            <div className="border-l-2 border-lime pl-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                Regla de acento
              </p>
              <p className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.04em] text-ink">
                ≤ 10%
              </p>
              <p className="mt-2 text-[12px] leading-relaxed text-muted">
                Lima solo en la acción primaria, el sello, el ingreso y el estado activo.
                El resto lo sostienen el papel, la tinta y la línea.
              </p>
            </div>
          </div>
        </div>

        <nav aria-label="Secciones del sistema" className="mt-9 border-y border-rule py-2.5">
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {SECTION_LINKS.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex min-h-11 items-center font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink md:min-h-0"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <section id="fundamento" aria-labelledby="fundamento-title" className="scroll-mt-6">
        <SectionHeader index="01" title="Fundamento" meta="Tres decisiones" />
        <div className="mt-5 grid gap-6 md:grid-cols-3 md:gap-8">
          {[
            {
              index: '01',
              title: 'El recibo es el objeto',
              body: 'Borde perforado, folio, cliente y sello. No es decoración: ordena la jerarquía y hace que el resumen se sienta como un comprobante que puedes revisar.',
            },
            {
              index: '02',
              title: 'La cifra manda',
              body: 'Números en Spline Sans Mono, alineados a la derecha, con la moneda más pequeña. El ojo compara antes de leer. Nunca dos cifras compitiendo por el mismo peso.',
            },
            {
              index: '03',
              title: 'Una sola voz',
              body: 'Español de Venezuela, seco y humano. “Ese real no se escapa”, no “¡Optimiza tus finanzas!”. Sin emojis, sin mayúsculas gritadas, sin promesas falsas.',
            },
          ].map((item) => (
            <div key={item.index}>
              <span className="font-mono text-[9px] tabular-nums text-muted">{item.index}</span>
              <h3 className="mt-2 font-display text-[21px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
                {item.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-8 border-t border-rule pt-5">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Marca
            </p>
            <div className="mt-2 flex items-center gap-4">
              <CoinMark size={38} className="text-ink" />
              <BrandLockup coinSize={22} textClassName="text-[26px]" />
            </div>
          </div>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Lema
            </p>
            <p className="mt-2 font-display text-[24px] font-semibold leading-none tracking-[-0.04em] text-ink">
              Gasta con intención.
            </p>
          </div>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Campaña
            </p>
            <p className="mt-2 font-display text-[24px] font-semibold leading-none tracking-[-0.04em] text-ink">
              Sé tacaño. Vive mejor.
            </p>
          </div>
        </div>
      </section>

      <section id="paleta" aria-labelledby="paleta-title" className="scroll-mt-6">
        <SectionHeader index="02" title="Paleta" meta="Tinta sobre papel" />
        <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((color) => (
            <div key={color.token} className="flex flex-col bg-surface">
              <div
                className="flex h-[92px] items-end justify-between p-3"
                style={{ background: `var(${color.variable})` }}
              >
                <span
                  className={cn(
                    'font-mono text-[8px] uppercase tracking-[0.12em]',
                    color.onDark ? 'text-[#F3F1EA] dark:text-[#15160F]' : 'text-[#15160F]',
                  )}
                >
                  {color.token}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-rule px-3 py-2.5">
                <p className="text-[11.5px] leading-snug text-ink-2">{color.role}</p>
                <p className="font-mono text-[8.5px] uppercase tracking-[0.06em] tabular-nums text-muted">
                  {color.light} / {color.dark}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[9px] uppercase leading-relaxed tracking-[0.06em] text-muted">
          Valores claro / oscuro. El tema oscuro es grafito, nunca negro puro. Cambia el
          tema desde el riel para ver ambos.
        </p>
      </section>

      <section id="tipografia" aria-labelledby="tipografia-title" className="scroll-mt-6">
        <SectionHeader index="03" title="Tipografía" meta="Tres voces" />
        <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Display · Bricolage Grotesque
            </p>
            <p className="mt-2 font-display text-[clamp(34px,5vw,56px)] font-semibold leading-[0.94] tracking-[-0.05em] text-ink">
              Los números no mienten.
            </p>
            <p className="mt-4 max-w-[54ch] font-display text-[19px] font-medium leading-[1.25] tracking-[-0.03em] text-ink-2">
              Titulares, cifras de portada y el nombre de la app. Tracking negativo,
              interlineado corto, sin adornos.
            </p>

            <div className="mt-8 border-t border-rule pt-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                Interfaz · Instrument Sans
              </p>
              <p className="mt-2 max-w-[58ch] text-[15px] leading-[1.6] text-ink-2">
                Texto de apoyo, etiquetas y descripciones. Frases cortas, largo de línea
                entre 40 y 68 caracteres, alineadas a la izquierda. Si una explicación
                necesita tres líneas, probablemente sobra una.
              </p>
            </div>

            <div className="mt-8 border-t border-rule pt-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                Cifras · Spline Sans Mono
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                <Money value={105100.4} currency="VES" className="text-[28px]" />
                <Money value={118.6} currency="USD" className="text-[28px]" />
                <span className="font-mono text-[14px] tabular-nums text-muted">
                  {formatRate(rateValue('bcv'))}
                </span>
              </div>
              <p className="mt-3 max-w-[58ch] text-[12.5px] leading-relaxed text-muted">
                Todo monto, tasa y fecha usa cifras tabulares. La moneda va en versalitas
                pequeñas; el signo negativo, antes del símbolo.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="border border-rule bg-surface p-4">
              <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                Escala usada
              </p>
              <div className="mt-2">
                <SpecRow name="Display XL" value="clamp 40–72 / 0.92" />
                <SpecRow name="Display" value="34 / 42 · 0.95" />
                <SpecRow name="Título" value="24 · 1.05" />
                <SpecRow name="Cuerpo" value="13–15 · 1.6" />
                <SpecRow name="Etiqueta" value="9–10 · mono" />
                <SpecRow name="Micro" value="8 · mono" />
              </div>
              <p className="mt-3 border-t border-rule pt-3 text-[11px] leading-relaxed text-muted">
                Ningún tamaño intermedio inventado. Si algo no cae en la escala, no entra.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="forma" aria-labelledby="forma-title" className="scroll-mt-6">
        <SectionHeader index="04" title="Forma y espacio" meta="Plano, con una excepción" />
        <div className="mt-5 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Radios
            </p>
            <div className="mt-3 flex items-end gap-3">
              {[
                { label: 'ticket', value: '2px', className: 'rounded-ticket' },
                { label: 'btn', value: '12px', className: 'rounded-btn' },
                { label: 'card', value: '18px', className: 'rounded-card' },
                { label: 'sheet', value: '22px', className: 'rounded-sheet' },
              ].map((radius) => (
                <div key={radius.label} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'h-12 w-12 border border-ink/30 bg-paper-2',
                      radius.className,
                    )}
                  />
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted">
                    {radius.label}
                  </span>
                  <span className="font-mono text-[8px] tabular-nums text-muted">
                    {radius.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Elevación
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-20 items-center justify-center border border-rule bg-surface font-mono text-[8px] uppercase tracking-[0.08em] text-muted">
                Plano
              </div>
              <div className="flex h-12 w-20 items-center justify-center rounded-btn border border-rule bg-surface font-mono text-[8px] uppercase tracking-[0.08em] text-muted shadow-[0_8px_24px_-12px_rgba(21,22,15,0.35)]">
                Hoja
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              Solo hojas y diálogos flotan. El resto se separa con línea, no con sombra.
            </p>
          </div>

          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Retícula
            </p>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {Array.from({ length: 8 }, (_, index) => (
                <span
                  key={index}
                  className="h-5 border border-rule bg-paper-2"
                  aria-hidden="true"
                />
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
              Móvil a 20px de margen; escritorio con riel de 84px y contenido máximo de
              1180px. Nada centrado salvo cifras dentro de una tabla.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 border-t border-rule pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Espacio', '4 / 8 / 12 / 16 / 24 / 32 / 40'],
            ['Bordes', '1px · 1.5px en recibo'],
            ['Toque mínimo', '44 × 44 px'],
            ['Contraste', 'AA en texto, AAA en cifras'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                {label}
              </span>
              <span className="font-mono text-[9px] tabular-nums text-ink-2">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="componentes" aria-labelledby="componentes-title" className="scroll-mt-6">
        <SectionHeader index="05" title="Componentes" meta="Estados incluidos" />
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel label="Botones">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary">Anotar gasto</Button>
                <Button variant="secondary">Secundario</Button>
                <Button variant="ghost">Fantasma</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="danger">Borrar</Button>
                <Button variant="quiet">Tranquilo</Button>
                <Button variant="secondary" loading>
                  Guardando
                </Button>
                <Button variant="primary" disabled>
                  Deshabilitado
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-rule pt-3">
                <Button size="sm">Pequeño</Button>
                <Button size="md">Mediano</Button>
                <Button size="lg">Grande</Button>
                <Button size="icon" variant="secondary" aria-label="Ejemplo de icono">
                  <Plus size={16} weight="bold" />
                </Button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                Altura mínima 36/44/48. Un solo primario por vista. El foco usa cobalto
                con 2px de separación.
              </p>
            </div>
          </Panel>

          <Panel label="Campos y segmentos">
            <div className="flex flex-col gap-4">
              <Field label="Concepto" placeholder="Mercado, café, pasaje" />
              <Field
                label="Monto"
                defaultValue="12.511,00"
                hint="Acepta coma decimal y puntos de miles."
              />
              <Field
                label="Correo"
                defaultValue="ana@"
                error="Escribe un correo válido."
              />
              <Segmented
                options={[
                  { value: 'week', label: 'Semana' },
                  { value: 'month', label: 'Mes' },
                  { value: 'year', label: 'Año' },
                ]}
                value={segmented}
                onChange={setSegmented}
                label="Período de ejemplo"
                size="sm"
              />
              <p className="text-[11px] leading-relaxed text-muted">
                Etiquetas en mono 9px. El error reemplaza la ayuda y usa borde tomate, sin
                sacudidas.
              </p>
            </div>
          </Panel>

          <Panel label="Sello y moneda">
            <div className="flex flex-wrap items-center gap-6">
              <Stamp label="Anotado" tone="lime" />
              <Stamp label="Al día" tone="ink" />
              <Stamp label="En rojo" tone="tomato" />
              <span className="h-10 w-px bg-rule" aria-hidden="true" />
              <Money value={105100.4} currency="VES" className="text-[24px]" />
              <Money value={-441.4} currency="USD" className="text-[24px] text-tomato-text" />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-rule pt-3">
              <p className="text-[11px] leading-relaxed text-muted">
                El sello rota −8°. Solo aparece al guardar; nunca decora una sección.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setStampKey((current) => current + 1)}
              >
                Repetir sello
              </Button>
            </div>
            <div className="mt-4 flex h-12 items-center justify-center border border-dashed border-rule">
              <Stamp key={stampKey} label="Anotado" tone="lime" animate />
            </div>
          </Panel>

          <Panel label="Categorías y fila">
            <div className="flex flex-wrap gap-2">
              {ICON_SHOWCASE.map((icon) => (
                <span
                  key={icon}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-rule bg-paper-2 text-ink-2"
                  title={icon}
                >
                  <CategoryGlyph icon={icon} size={14} />
                </span>
              ))}
            </div>
            <div className="mt-3">
              <TransactionRow
                tx={SAMPLE_TX}
                category={SAMPLE_CATEGORIES[0]}
                onEdit={() => undefined}
                showDay
                className="last:border-b-0"
              />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              La fila completa es el objetivo de toque. El icono de Telegram solo aparece
              cuando el movimiento llegó por el bot.
            </p>
          </Panel>

          <Panel label="Hoja y diálogo">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => open({ kind: 'expense' })}>
                Abrir hoja de registro
              </Button>
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Abrir diálogo
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              La hoja sube 340ms con curva de salida; el diálogo escala 0.97 → 1 en 240ms.
              El fondo se oscurece sin desenfoque.
            </p>
            <div className="mt-3 flex items-center gap-2 border-t border-rule pt-3 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
              <Ruler size={13} weight="bold" />
              Máx. 92dvh · radio superior 22px
            </div>
          </Panel>

          <Panel label="Vacío y error">
            <EmptyState
              title="Ni un movimiento. El primero es el que cuenta."
              body="Anota un gasto o un ingreso y empieza el mes. Sin métricas inventadas."
              action={<Button size="sm">Anotar el primero</Button>}
              className="border-0 bg-transparent p-0 md:p-0"
            />
          </Panel>
        </div>
      </section>

      <section id="graficas" aria-labelledby="graficas-title" className="scroll-mt-6">
        <SectionHeader index="06" title="Gráficas" meta="Datos de muestra" />
        <p className="mt-3 max-w-[64ch] text-[12.5px] leading-relaxed text-muted">
          Las gráficas son tablas dibujadas: cada una tiene su versión accesible y nunca
          dependen del color solo. La lima mide ingreso; el tomate, gasto; la tinta, todo
          lo demás.
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <Panel label="Gasto por día · octubre 2026">
              <DailyBars days={SAMPLE_DAYS} currency="VES" />
            </Panel>
          </div>
          <div className="lg:col-span-5">
            <Panel label="Últimos seis meses">
              <DivergingBars months={SAMPLE_MONTHS} currency="USD" />
            </Panel>
          </div>
          <div className="lg:col-span-5">
            <Panel label="Reparto por categoría">
              <CategoryBars slices={SAMPLE_SLICES} currency="USD" />
            </Panel>
          </div>
          <div className="lg:col-span-7">
            <Panel label="Mapa de gasto · octubre 2026">
              <Heatmap
                mode="month"
                month={heatMonth}
                data={SAMPLE_HEAT}
                currency="VES"
              />
            </Panel>
          </div>
          <div className="lg:col-span-12">
            <Panel label="Sparkline de tasa">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                    BCV · 30 días
                  </p>
                  <p className="mt-1 font-mono text-[18px] tabular-nums text-ink">
                    {formatRate(rateValue('bcv'))}
                  </p>
                </div>
                <Sparkline
                  values={Array.from({ length: 30 }, (_, index) =>
                    rateValue('bcv') * (1 - (29 - index) * 0.0013),
                  )}
                  width={220}
                  height={36}
                  className="text-cobalt"
                />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                La sparkline es contexto, no protagonista. Si no hay 30 puntos reales, no
                se dibuja.
              </p>
            </Panel>
          </div>
        </div>
      </section>

      <section id="recibo" aria-labelledby="recibo-title" className="scroll-mt-6">
        <SectionHeader index="07" title="Anatomía del recibo" meta="La pieza central" />
        <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="lg:col-span-6 xl:col-span-5">
            <MonthlyReceipt
              month={new Date(2026, 9, 1)}
              profile={profile}
              totals={SAMPLE_TOTALS}
            />
            <p className="mt-3 font-mono text-[8.5px] uppercase tracking-[0.1em] text-muted">
              Datos de muestra · no son cifras de tu cuenta
            </p>
          </div>
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="flex flex-col">
              {[
                ['Cabecera', 'Resumen, mes y estado. El estado se calcula; nunca se escribe a mano.'],
                ['Balance', 'La cifra más grande de la pantalla. Una sola. El equivalente va debajo, más pequeño.'],
                ['Ingresos y gastos', 'Dos líneas, alineadas al decimal. El signo vive antes del símbolo.'],
                ['Tasas', 'BCV y paralelo con su fecha. La tasa usada al anotar se congela.'],
                ['Pie', 'Cliente y folio. El folio usa yyyy-MM para poder rastrear el período.'],
                ['Borde', 'Perforado con gradiente radial de 14px. No es una imagen ni un SVG.'],
              ].map(([title, body], index) => (
                <div
                  key={title}
                  className="flex gap-4 border-t border-rule py-3.5 first:border-t-0 first:pt-0"
                >
                  <span className="font-mono text-[9px] tabular-nums text-muted">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-display text-[16px] font-semibold leading-none tracking-[-0.02em] text-ink">
                      {title}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-l-2 border-lime pl-4">
              <p className="text-[12px] leading-relaxed text-ink-2">
                El recibo aparece solo en dos lugares: el resumen del mes y el registro
                rápido. Si se repite en cada pantalla, deja de ser un recibo y se vuelve
                un fondo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="movimiento" aria-labelledby="movimiento-title" className="scroll-mt-6">
        <SectionHeader index="08" title="Movimiento" meta="Cuatro momentos" />
        <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              index: '01',
              title: 'Abrir la hoja',
              spec: '340ms · cubic-bezier(.16,1,.3,1)',
              body: 'Sube desde el borde inferior. El fondo se oscurece al 55%.',
            },
            {
              index: '02',
              title: 'Guardar',
              spec: '260ms · rebote suave',
              body: 'El sello entra rotado y se asienta. Es la única celebración.',
            },
            {
              index: '03',
              title: 'Cambiar de período',
              spec: '180ms · fundido',
              body: 'El recibo se desvanece y vuelve con las cifras nuevas. Sin deslizamiento.',
            },
            {
              index: '04',
              title: 'Dibujar la gráfica',
              spec: '420ms · escala vertical',
              body: 'Las barras crecen desde su base con un retraso de 8ms por barra.',
            },
          ].map((moment) => (
            <div key={moment.index} className="bg-surface p-4">
              <span className="font-mono text-[8px] tabular-nums text-muted">
                {moment.index}
              </span>
              <p className="mt-2 font-display text-[17px] font-semibold leading-none tracking-[-0.025em] text-ink">
                {moment.title}
              </p>
              <p className="mt-1.5 font-mono text-[8px] uppercase leading-relaxed tracking-[0.06em] text-cobalt">
                {moment.spec}
              </p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{moment.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
          Con <span className="font-mono text-[10px]">prefers-reduced-motion</span> todo
          dura 0.01ms y el sello aparece sin rebote. Ninguna animación bloquea una acción.
        </p>
      </section>

      <section id="voz" aria-labelledby="voz-title" className="scroll-mt-6">
        <SectionHeader index="09" title="Voz" meta="Cómo suena stingy" />
        <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink-2">
              Decimos
            </p>
            <div className="mt-2">
              {[
                'Anotado. Ese real no se escapa.',
                'Todavía no hay gastos. El primero es el que cuenta.',
                'Sin señal. Tus datos siguen aquí.',
                'El día más caro fue el 23, con Bs 11.400,00.',
              ].map((line) => (
                <p
                  key={line}
                  className="border-t border-rule py-2.5 text-[13px] leading-relaxed text-ink-2 first:border-t-0"
                >
                  “{line}”
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-tomato-text">
              No decimos
            </p>
            <div className="mt-2">
              {[
                '¡Bienvenido a bordo! 🚀',
                'Optimiza tu salud financiera con insights inteligentes.',
                'Únete a miles de usuarios que ya ahorran.',
                'Tus finanzas, potenciadas por IA.',
              ].map((line) => (
                <p
                  key={line}
                  className="border-t border-rule py-2.5 text-[13px] leading-relaxed text-muted line-through decoration-tomato-text/40 first:border-t-0"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-4 max-w-[70ch] text-[11.5px] leading-relaxed text-muted">
          Tuteo venezolano, sin diminutivos forzados. Los errores explican qué pasó y qué
          hacer; no culpan. Nunca se inventan usuarios, testimonios ni métricas.
        </p>
      </section>

      <section id="anti-slop" aria-labelledby="anti-slop-title" className="scroll-mt-6">
        <SectionHeader index="10" title="Contrato anti-plantilla" meta="Antes de publicar" />
        <div className="mt-5 grid gap-x-10 gap-y-0 lg:grid-cols-2">
          <div>
            <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Siempre
            </p>
            <Rule title="Una jerarquía por pantalla">
              Un titular, una cifra dominante, una acción primaria. Lo demás se subordina.
            </Rule>
            <Rule title="Línea antes que sombra">
              La separación se resuelve con 1px. Solo hojas y diálogos flotan.
            </Rule>
            <Rule title="Texto a la izquierda">
              Salvo cifras en tablas o columnas comparables. Nada de párrafos centrados.
            </Rule>
            <Rule title="Datos reales o nada">
              Cero testimonios, métricas, logos o precios inventados. El ejemplo se rotula
              como ejemplo.
            </Rule>
            <Rule title="Accesible de fábrica">
              44px de toque, foco visible, contraste AA, tablas para las gráficas y
              movimiento reducido.
            </Rule>
          </div>
          <div>
            <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
              Nunca
            </p>
            {[
              'Degradados púrpura-azul o brillos violeta.',
              'Glassmorphism, desenfoques decorativos o grano falso.',
              'Emojis en títulos, botones o mensajes del bot.',
              'Tres tarjetas genéricas con iconos intercambiables.',
              'Precios de tres niveles inventados o “plan Pro” falso.',
              'Animaciones de scroll en cada sección.',
              'Métricas de ahorro que el usuario no ha vivido.',
              'Hotlinks a fuentes o imágenes de terceros.',
            ].map((line) => (
              <div key={line} className="flex gap-3 border-t border-rule py-3">
                <X
                  size={14}
                  weight="bold"
                  className="mt-0.5 shrink-0 text-tomato-text"
                  aria-hidden="true"
                />
                <p className="text-[12.5px] leading-relaxed text-ink-2">{line}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CoinMark size={22} className="text-ink" />
            <p className="font-mono text-[8.5px] uppercase leading-relaxed tracking-[0.1em] text-muted">
              Tokens en src/index.css · Componentes en src/components
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-1.5 rounded-btn border border-ink/25 bg-surface px-3 text-[13px] font-medium text-ink transition-colors hover:border-ink/50 md:h-9"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Diálogo de ejemplo"
        description="Así se ve una confirmación. El título explica la acción, no la adorna; el botón repite el verbo."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Entendido
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-2">
          Este diálogo existe solo en la documentación. En la app, cada diálogo nace de
          una acción concreta y se cierra con la misma palabra que la abrió.
        </p>
      </Modal>
    </div>
  )
}
