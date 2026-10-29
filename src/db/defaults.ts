import type { Category } from './types'

export const DEMO_PROFILE_ID = 'demo'
export const DEMO_LEDGER_ID = 'ledger_demo'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', ledgerId: DEMO_LEDGER_ID, name: 'Comida', icon: 'food', kind: 'expense', order: 1 },
  { id: 'cat_transport', ledgerId: DEMO_LEDGER_ID, name: 'Transporte', icon: 'transport', kind: 'expense', order: 2 },
  { id: 'cat_home', ledgerId: DEMO_LEDGER_ID, name: 'Hogar', icon: 'home', kind: 'expense', order: 3 },
  { id: 'cat_services', ledgerId: DEMO_LEDGER_ID, name: 'Servicios', icon: 'services', kind: 'expense', order: 4 },
  { id: 'cat_health', ledgerId: DEMO_LEDGER_ID, name: 'Salud', icon: 'health', kind: 'expense', order: 5 },
  { id: 'cat_fun', ledgerId: DEMO_LEDGER_ID, name: 'Ocio', icon: 'fun', kind: 'expense', order: 6 },
  { id: 'cat_shopping', ledgerId: DEMO_LEDGER_ID, name: 'Compras', icon: 'shopping', kind: 'expense', order: 7 },
  { id: 'cat_pets', ledgerId: DEMO_LEDGER_ID, name: 'Mascotas', icon: 'pets', kind: 'expense', order: 8 },
  { id: 'cat_salary', ledgerId: DEMO_LEDGER_ID, name: 'Sueldo', icon: 'salary', kind: 'income', order: 1 },
  { id: 'cat_freelance', ledgerId: DEMO_LEDGER_ID, name: 'Freelance', icon: 'freelance', kind: 'income', order: 2 },
  { id: 'cat_sales', ledgerId: DEMO_LEDGER_ID, name: 'Ventas', icon: 'sales', kind: 'income', order: 3 },
  { id: 'cat_other_income', ledgerId: DEMO_LEDGER_ID, name: 'Otros ingresos', icon: 'other', kind: 'income', order: 4 },
  { id: 'cat_other', ledgerId: DEMO_LEDGER_ID, name: 'Otros', icon: 'other', kind: 'expense', order: 9 },
]

export const DEFAULT_CATEGORY_KEYS = new Set(
  DEFAULT_CATEGORIES.map((category) => `${category.kind}:${category.name}`),
)

export function isDefaultCategory(category: Pick<Category, 'kind' | 'name'>) {
  return DEFAULT_CATEGORY_KEYS.has(`${category.kind}:${category.name}`)
}
