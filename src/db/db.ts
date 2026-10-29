import Dexie, { type Table } from 'dexie'
import { DEFAULT_CATEGORIES, DEMO_LEDGER_ID } from './defaults'
import type {
  Category,
  Ledger,
  LedgerMember,
  MetaRow,
  OutboxEntry,
  Profile,
  RateRow,
  Tx,
} from './types'

class StingyDB extends Dexie {
  profiles!: Table<Profile, string>
  categories!: Table<Category, string>
  transactions!: Table<Tx, string>
  ledgers!: Table<Ledger, string>
  ledgerMembers!: Table<LedgerMember, string>
  rates!: Table<RateRow, string>
  meta!: Table<MetaRow, string>
  outbox!: Table<OutboxEntry, string>

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
    this.version(3).stores({
      profiles: 'id, demo',
      categories: 'id, ledgerId, kind, order, updatedAt',
      transactions: 'id, ledgerId, occurredOn, categoryId, kind, createdAt, updatedAt',
      ledgers: 'id, kind',
      ledgerMembers: 'id, ledgerId, userId',
      rates: 'type',
      meta: 'key',
      outbox: 'id, userId, createdAt, [userId+table+rowId]',
    })
  }
}

export const db = new StingyDB()

export async function getMeta(key: string) {
  return (await db.meta.get(key))?.value
}

export async function setMeta(key: string, value: string) {
  await db.meta.put({ key, value })
}

export async function deleteMeta(key: string) {
  await db.meta.delete(key)
}

export async function ensureCategories(ledgerId = DEMO_LEDGER_ID) {
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

export async function clearDemoData() {
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.categories,
      db.transactions,
      db.ledgers,
      db.ledgerMembers,
      db.meta,
    ],
    async () => {
      await db.transactions.where('ledgerId').equals(DEMO_LEDGER_ID).delete()
      await db.categories.where('ledgerId').equals(DEMO_LEDGER_ID).delete()
      await db.ledgerMembers.where('ledgerId').equals(DEMO_LEDGER_ID).delete()
      await db.ledgers.delete(DEMO_LEDGER_ID)
      await db.profiles.delete('demo')
      await db.meta.delete('demo:active')
    },
  )
}

export async function clearUserData(userId: string, ledgerId?: string) {
  await db.transaction(
    'rw',
    [
      db.profiles,
      db.categories,
      db.transactions,
      db.ledgers,
      db.ledgerMembers,
      db.outbox,
      db.meta,
    ],
    async () => {
      await db.outbox.where('userId').equals(userId).delete()
      if (ledgerId) {
        await db.transactions.where('ledgerId').equals(ledgerId).delete()
        await db.categories.where('ledgerId').equals(ledgerId).delete()
        await db.ledgerMembers.where('ledgerId').equals(ledgerId).delete()
        await db.ledgers.delete(ledgerId)
      }
      await db.profiles.delete(userId)
      await db.meta.delete(`sync:last:${userId}`)
      await db.meta.delete(`sync:error:${userId}`)
    },
  )
}

export async function pendingCount(userId: string) {
  return db.outbox.where('userId').equals(userId).count()
}

export async function activeCategories(ledgerId: string) {
  const rows = await db.categories.where('ledgerId').equals(ledgerId).sortBy('order')
  return rows.filter((category) => !category.deletedAt)
}

export async function activeTransactions(ledgerId: string) {
  const rows = await db.transactions.where('ledgerId').equals(ledgerId).toArray()
  return rows.filter((tx) => !tx.deletedAt)
}
