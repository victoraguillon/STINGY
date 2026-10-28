import Dexie, { type Table } from 'dexie'
import type { Profile } from './types'
import { DEFAULT_CATEGORIES, PERSONAL_LEDGER_ID } from './defaults'
import type { Category, Ledger, LedgerMember, Tx } from './types'

class StingyDB extends Dexie {
  profiles!: Table<Profile, string>
  categories!: Table<Category, string>
  transactions!: Table<Tx, string>
  ledgers!: Table<Ledger, string>
  ledgerMembers!: Table<LedgerMember, string>

  constructor() {
    super('stingy')
    this.version(1).stores({
      profiles: 'id',
      categories: 'id, ledgerId, kind, order',
      transactions: 'id, ledgerId, occurredOn, categoryId, kind, createdAt',
    })
    this.version(2).stores({
      profiles: 'id',
      categories: 'id, ledgerId, kind, order',
      transactions: 'id, ledgerId, occurredOn, categoryId, kind, createdAt',
      ledgers: 'id, kind',
      ledgerMembers: 'id, ledgerId, userId',
    })
  }
}

export const db = new StingyDB()

export async function ensureCategories(ledgerId = PERSONAL_LEDGER_ID) {
  const existing = await db.categories.where('ledgerId').equals(ledgerId).count()
  if (existing > 0) return
  await db.categories.bulkPut(
    DEFAULT_CATEGORIES.map((category) => ({ ...category, ledgerId })),
  )
}

export async function ensureLedger(profile: Profile) {
  const memberId = `member_${profile.ledgerId}_${profile.id}`
  await db.transaction('rw', db.ledgers, db.ledgerMembers, async () => {
    const ledger = await db.ledgers.get(profile.ledgerId)
    if (!ledger) {
      await db.ledgers.put({
        id: profile.ledgerId,
        name: 'Personal',
        kind: 'personal',
        baseCurrency: profile.baseCurrency,
        createdAt: profile.createdAt,
      })
    }
    const member = await db.ledgerMembers.get(memberId)
    if (!member) {
      await db.ledgerMembers.put({
        id: memberId,
        ledgerId: profile.ledgerId,
        userId: profile.id,
        role: 'owner',
        joinedAt: profile.createdAt,
      })
    }
  })
}

export async function clearAll() {
  await db.transaction(
    'rw',
    db.profiles,
    db.categories,
    db.transactions,
    db.ledgers,
    db.ledgerMembers,
    async () => {
      await db.transactions.clear()
      await db.categories.clear()
      await db.ledgerMembers.clear()
      await db.ledgers.clear()
      await db.profiles.clear()
    },
  )
}
