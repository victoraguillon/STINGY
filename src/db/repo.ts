import type { Category, Profile, SyncTable, Tx } from './types'
import { db } from './db'
import { DEMO_LEDGER_ID } from './defaults'
import { newId } from '../lib/id'
import { requestSync } from '../sync/engine'

async function enqueue(table: SyncTable, userId: string, rowId: string) {
  if (!userId) return
  const existing = await db.outbox
    .where('[userId+table+rowId]')
    .equals([userId, table, rowId])
    .first()
  if (existing) {
    await db.outbox.update(existing.id, { createdAt: new Date().toISOString() })
    return
  }
  await db.outbox.add({
    id: newId(),
    userId,
    table,
    rowId,
    createdAt: new Date().toISOString(),
    attempts: 0,
  })
}

export async function dequeue(table: SyncTable, userId: string, rowId: string) {
  await db.outbox
    .where('[userId+table+rowId]')
    .equals([userId, table, rowId])
    .delete()
}

export async function saveProfile(profile: Profile) {
  await db.profiles.put(profile)
  if (!profile.demo) await enqueue('profiles', profile.id, profile.id)
  requestSync()
}

export async function saveCategory(category: Category, userId: string, demo = false) {
  const now = new Date().toISOString()
  await db.categories.put({
    ...category,
    createdAt: category.createdAt ?? now,
    updatedAt: now,
  })
  if (!demo) await enqueue('categories', userId, category.id)
  requestSync()
}

export async function removeCategory(category: Category, userId: string, demo = false) {
  const now = new Date().toISOString()
  await db.categories.update(category.id, { deletedAt: now, updatedAt: now })
  if (!demo) await enqueue('categories', userId, category.id)
  requestSync()
}

export async function saveTransaction(tx: Tx) {
  const now = new Date().toISOString()
  await db.transactions.put({ ...tx, updatedAt: now })
  if (tx.ledgerId !== DEMO_LEDGER_ID) {
    await enqueue('transactions', tx.createdBy, tx.id)
  }
  requestSync()
}

export async function removeTransaction(tx: Tx) {
  const now = new Date().toISOString()
  await db.transactions.update(tx.id, { deletedAt: now, updatedAt: now })
  if (tx.ledgerId !== DEMO_LEDGER_ID) {
    await enqueue('transactions', tx.createdBy, tx.id)
  }
  requestSync()
}

export async function restoreTransaction(tx: Tx) {
  await saveTransaction({ ...tx, deletedAt: undefined })
}

export async function discardLocalTransaction(tx: Tx) {
  await db.transactions.delete(tx.id)
  await dequeue('transactions', tx.createdBy, tx.id)
  requestSync()
}
