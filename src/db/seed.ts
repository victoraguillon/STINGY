import { startOfMonth, subMonths } from 'date-fns'
import { clearAll, db, ensureCategories, ensureLedger } from './db'
import { PERSONAL_LEDGER_ID } from './defaults'
import { newId } from '../lib/id'
import { toDayString } from '../lib/dates'
import { rateValue, toUsd } from '../lib/fx'
import type {
  Category,
  Currency,
  Profile,
  RateType,
  Tx,
  TxKind,
  TxSource,
} from './types'

interface RegisterInput {
  name: string
  email: string
  baseCurrency: Currency
  defaultRateType: RateType
  onboardingComplete?: boolean
}

export async function createProfile(input: RegisterInput): Promise<Profile> {
  const profile: Profile = {
    id: 'me',
    name: input.name.trim() || 'Sin nombre',
    email: input.email.trim().toLowerCase(),
    ledgerId: PERSONAL_LEDGER_ID,
    baseCurrency: input.baseCurrency,
    defaultRateType: input.defaultRateType,
    onboardingComplete: input.onboardingComplete ?? false,
    demo: false,
    createdAt: new Date().toISOString(),
  }
  await db.profiles.put(profile)
  await ensureCategories()
  await ensureLedger(profile)
  return profile
}

interface Template {
  day: number
  categoryId: string
  note: string
  amount: number
  currency: Currency
  kind?: TxKind
  source?: TxSource
}

const EXPENSES: Template[] = [
  { day: 1, categoryId: 'cat_food', note: 'Pan', amount: 1.2, currency: 'USD' },
  { day: 2, categoryId: 'cat_home', note: 'Alquiler', amount: 120, currency: 'USD' },
  { day: 3, categoryId: 'cat_services', note: 'Internet', amount: 25, currency: 'USD' },
  { day: 4, categoryId: 'cat_food', note: 'Mercado', amount: 38500, currency: 'VES' },
  { day: 5, categoryId: 'cat_food', note: 'Pan', amount: 1.2, currency: 'USD' },
  { day: 6, categoryId: 'cat_pets', note: 'Comida del gato', amount: 4200, currency: 'VES' },
  { day: 7, categoryId: 'cat_food', note: 'Café', amount: 3.2, currency: 'USD' },
  { day: 8, categoryId: 'cat_services', note: 'Teléfono', amount: 2400, currency: 'VES' },
  { day: 8, categoryId: 'cat_food', note: 'Almuerzo', amount: 5900, currency: 'VES' },
  { day: 9, categoryId: 'cat_services', note: 'Electricidad', amount: 950, currency: 'VES' },
  { day: 9, categoryId: 'cat_transport', note: 'Pasajes', amount: 1800, currency: 'VES', source: 'telegram' },
  { day: 10, categoryId: 'cat_fun', note: 'Cine', amount: 7.5, currency: 'USD' },
  { day: 11, categoryId: 'cat_food', note: 'Mercado', amount: 27800, currency: 'VES' },
  { day: 11, categoryId: 'cat_food', note: 'Pan', amount: 1.2, currency: 'USD' },
  { day: 12, categoryId: 'cat_transport', note: 'Pasajes', amount: 1800, currency: 'VES' },
  { day: 13, categoryId: 'cat_health', note: 'Farmacia', amount: 7600, currency: 'VES' },
  { day: 14, categoryId: 'cat_food', note: 'Café', amount: 3.2, currency: 'USD' },
  { day: 15, categoryId: 'cat_fun', note: 'Streaming', amount: 8.99, currency: 'USD' },
  { day: 16, categoryId: 'cat_food', note: 'Almuerzo', amount: 5900, currency: 'VES' },
  { day: 16, categoryId: 'cat_transport', note: 'Pasajes', amount: 1800, currency: 'VES' },
  { day: 17, categoryId: 'cat_food', note: 'Pan', amount: 1.2, currency: 'USD' },
  { day: 18, categoryId: 'cat_food', note: 'Mercado', amount: 41200, currency: 'VES', source: 'telegram' },
  { day: 19, categoryId: 'cat_home', note: 'Limpieza', amount: 3400, currency: 'VES' },
  { day: 20, categoryId: 'cat_transport', note: 'Pasajes', amount: 1800, currency: 'VES' },
  { day: 21, categoryId: 'cat_food', note: 'Café', amount: 3.2, currency: 'USD' },
  { day: 22, categoryId: 'cat_food', note: 'Pan', amount: 1.2, currency: 'USD' },
  { day: 23, categoryId: 'cat_transport', note: 'Pasajes', amount: 1800, currency: 'VES' },
  { day: 23, categoryId: 'cat_food', note: 'Pan', amount: 1.2, currency: 'USD' },
  { day: 24, categoryId: 'cat_health', note: 'Consulta', amount: 20, currency: 'USD' },
  { day: 25, categoryId: 'cat_food', note: 'Mercado', amount: 31600, currency: 'VES' },
  { day: 26, categoryId: 'cat_fun', note: 'Salida', amount: 12, currency: 'USD' },
  { day: 27, categoryId: 'cat_transport', note: 'Pasajes', amount: 1800, currency: 'VES' },
  { day: 28, categoryId: 'cat_food', note: 'Pan', amount: 1.2, currency: 'USD' },
]

const INCOMES: Template[] = [
  { day: 1, categoryId: 'cat_salary', note: 'Sueldo', amount: 380, currency: 'USD', kind: 'income' },
  { day: 12, categoryId: 'cat_freelance', note: 'Freelance', amount: 110, currency: 'USD', kind: 'income' },
  { day: 22, categoryId: 'cat_sales', note: 'Venta de diseño', amount: 70, currency: 'USD', kind: 'income' },
]

function buildDemoTransactions(profile: Profile, categories: Category[]) {
  const today = new Date()
  const transactions: Tx[] = []
  const known = new Set(categories.map((category) => category.id))

  for (let back = 5; back >= 0; back -= 1) {
    const month = startOfMonth(subMonths(today, back))
    const isCurrent = back === 0
    const maxDay = isCurrent ? today.getDate() : 31
    const bsFactor = 0.94 ** back
    const usdFactor = 1 - back * 0.015

    const add = (template: Template, kind: TxKind) => {
      if (!known.has(template.categoryId)) return
      if (template.day > maxDay) return
      const rateType: RateType = template.currency === 'USD' ? 'paralelo' : 'bcv'
      const rate = rateValue(rateType)
      let amount = template.amount
      if (template.currency === 'VES') {
        amount = Math.round((amount * bsFactor) / 100) * 100
      } else {
        amount = Math.round(amount * usdFactor * 100) / 100
      }
      const occurredOn = toDayString(new Date(month.getFullYear(), month.getMonth(), template.day))
      const createdAt = new Date(
        month.getFullYear(),
        month.getMonth(),
        template.day,
        9 + (template.day % 8),
        12,
      ).toISOString()
      transactions.push({
        id: newId('tx'),
        ledgerId: profile.ledgerId,
        createdBy: profile.id,
        kind,
        amount,
        currency: template.currency,
        rateType,
        rate,
        amountUsd: toUsd(amount, template.currency, rate),
        categoryId: template.categoryId,
        note: template.note,
        occurredOn,
        source: template.source ?? 'web',
        createdAt,
      })
    }

    for (const template of EXPENSES) add(template, 'expense')
    for (const template of INCOMES) {
      const extra = template.categoryId === 'cat_freelance' ? back * 8 : template.categoryId === 'cat_sales' ? back * 5 : 0
      add({ ...template, amount: template.amount + extra }, 'income')
    }
    if (back % 3 === 0) {
      add(
        { day: 20, categoryId: 'cat_shopping', note: 'Ropa', amount: 35, currency: 'USD' },
        'expense',
      )
    }
    add(
      {
        day: 29,
        categoryId: 'cat_health',
        note: 'Consulta',
        amount: 15,
        currency: 'USD',
        source: 'telegram',
      },
      'expense',
    )
  }

  return transactions
}

export async function seedDemo() {
  await clearAll()
  await ensureCategories()
  const profile: Profile = {
    id: 'me',
    name: 'Ana Torres',
    email: 'ana@stingy.local',
    ledgerId: PERSONAL_LEDGER_ID,
    baseCurrency: 'VES',
    defaultRateType: 'bcv',
    onboardingComplete: true,
    demo: true,
    createdAt: new Date().toISOString(),
  }
  await db.profiles.put(profile)
  await ensureCategories()
  await ensureLedger(profile)
  const categories = await db.categories.toArray()
  await db.transactions.bulkPut(buildDemoTransactions(profile, categories))
  return profile
}
