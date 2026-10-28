export type Currency = 'VES' | 'USD'
export type TxKind = 'expense' | 'income'
export type RateType = 'bcv' | 'paralelo'
export type TxSource = 'web' | 'telegram'
export type ThemeChoice = 'system' | 'light' | 'dark'

export type CategoryIcon =
  | 'food'
  | 'transport'
  | 'home'
  | 'services'
  | 'health'
  | 'fun'
  | 'shopping'
  | 'pets'
  | 'salary'
  | 'freelance'
  | 'sales'
  | 'other'

export interface Profile {
  id: string
  name: string
  email: string
  ledgerId: string
  baseCurrency: Currency
  defaultRateType: RateType
  onboardingComplete: boolean
  demo: boolean
  createdAt: string
}

export type LedgerKind = 'personal' | 'shared'
export type MemberRole = 'owner' | 'member'

export interface Ledger {
  id: string
  name: string
  kind: LedgerKind
  baseCurrency: Currency
  createdAt: string
}

export interface LedgerMember {
  id: string
  ledgerId: string
  userId: string
  role: MemberRole
  joinedAt: string
}

export interface Category {
  id: string
  ledgerId: string
  name: string
  icon: CategoryIcon
  kind: TxKind
  order: number
}

export interface Tx {
  id: string
  ledgerId: string
  createdBy: string
  kind: TxKind
  amount: number
  currency: Currency
  rateType: RateType
  rate: number
  amountUsd: number
  categoryId: string
  note: string
  occurredOn: string
  source: TxSource
  createdAt: string
  updatedAt?: string
}
