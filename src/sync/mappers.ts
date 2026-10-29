import type { Category, Currency, Profile, RateType, Tx, TxKind, TxSource } from '../db/types'

export interface ProfileRow {
  id: string
  email: string | null
  name: string | null
  default_ledger_id: string | null
  base_currency: Currency
  default_rate_type: RateType
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface CategoryRow {
  id: string
  ledger_id: string
  name: string
  icon: string
  kind: TxKind
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TransactionRow {
  id: string
  ledger_id: string
  created_by: string
  kind: TxKind
  amount: number | string
  currency: Currency
  rate_type: RateType
  rate: number | string
  amount_usd: number | string
  category_id: string | null
  note: string | null
  occurred_on: string
  source: TxSource
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export function profileFromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name?.trim() || 'Sin nombre',
    email: row.email ?? '',
    ledgerId: row.default_ledger_id ?? '',
    baseCurrency: row.base_currency,
    defaultRateType: row.default_rate_type,
    onboardingComplete: row.onboarding_complete,
    demo: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function categoryFromRow(row: CategoryRow): Category {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    name: row.name,
    icon: row.icon as Category['icon'],
    kind: row.kind,
    order: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  }
}

export function transactionFromRow(row: TransactionRow): Tx {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    createdBy: row.created_by,
    kind: row.kind,
    amount: Number(row.amount),
    currency: row.currency,
    rateType: row.rate_type,
    rate: Number(row.rate),
    amountUsd: Number(row.amount_usd),
    categoryId: row.category_id ?? '',
    note: row.note ?? '',
    occurredOn: row.occurred_on,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  }
}

export function profileToRow(profile: Profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    default_ledger_id: profile.ledgerId,
    base_currency: profile.baseCurrency,
    default_rate_type: profile.defaultRateType,
    onboarding_complete: profile.onboardingComplete,
  }
}

export function categoryToRow(category: Category) {
  return {
    id: category.id,
    ledger_id: category.ledgerId,
    name: category.name,
    icon: category.icon,
    kind: category.kind,
    position: category.order,
    deleted_at: category.deletedAt ?? null,
  }
}

export function transactionToRow(tx: Tx) {
  return {
    id: tx.id,
    ledger_id: tx.ledgerId,
    created_by: tx.createdBy,
    kind: tx.kind,
    amount: tx.amount,
    currency: tx.currency,
    rate_type: tx.rateType,
    rate: tx.rate,
    amount_usd: tx.amountUsd,
    category_id: tx.categoryId || null,
    note: tx.note,
    occurred_on: tx.occurredOn,
    source: tx.source,
    deleted_at: tx.deletedAt ?? null,
  }
}
