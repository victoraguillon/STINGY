import { useSyncExternalStore } from 'react'
import { db, ensureLedger, getMeta, setMeta } from '../db/db'
import type { OutboxEntry, Profile, SyncTable } from '../db/types'
import { supabase, supabaseConfigured } from '../lib/supabase'
import {
  categoryFromRow,
  categoryToRow,
  profileFromRow,
  profileToRow,
  transactionFromRow,
  transactionToRow,
  type CategoryRow,
  type ProfileRow,
  type TransactionRow,
} from './mappers'

export type SyncPhase = 'idle' | 'syncing' | 'offline' | 'error' | 'disabled'

export interface SyncStatus {
  phase: SyncPhase
  lastSync: string | null
  error: string | null
}

let status: SyncStatus = {
  phase: supabaseConfigured ? 'idle' : 'disabled',
  lastSync: null,
  error: null,
}

const listeners = new Set<() => void>()

function emit(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot() {
  return status
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

let running = false
let timer: number | null = null
let listening = false

export function requestSync() {
  if (!supabaseConfigured) return
  if (typeof window === 'undefined') return
  if (timer !== null) window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    timer = null
    void runSync()
  }, 700)
}

export function startSync() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('online', requestSync)
  requestSync()
}

export function stopSync() {
  if (!listening || typeof window === 'undefined') return
  listening = false
  window.removeEventListener('online', requestSync)
}

function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Error desconocido'
}

function newer(remote?: string, local?: string) {
  if (!local) return true
  if (!remote) return false
  return new Date(remote).getTime() > new Date(local).getTime()
}

export async function pullProfile(userId: string): Promise<Profile | null> {
  if (!supabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(messageOf(error))
  if (!data) return null
  const profile = profileFromRow(data as ProfileRow)
  if (!profile.ledgerId) return null
  await db.profiles.put(profile)
  await ensureLedger(profile)
  return profile
}

async function pushEntry(entry: OutboxEntry) {
  if (entry.table === 'profiles') {
    const profile = await db.profiles.get(entry.rowId)
    if (!profile) return
    const patch = profileToRow(profile)
    const { error } = await supabase
      .from('profiles')
      .update({
        email: patch.email,
        name: patch.name,
        default_ledger_id: patch.default_ledger_id,
        base_currency: patch.base_currency,
        default_rate_type: patch.default_rate_type,
        onboarding_complete: patch.onboarding_complete,
      })
      .eq('id', profile.id)
    if (error) throw error
    return
  }

  if (entry.table === 'categories') {
    const category = await db.categories.get(entry.rowId)
    if (!category) return
    const { error } = await supabase
      .from('categories')
      .upsert(categoryToRow(category), { onConflict: 'id' })
    if (error) throw error
    return
  }

  const tx = await db.transactions.get(entry.rowId)
  if (!tx) return
  const { error } = await supabase
    .from('transactions')
    .upsert(transactionToRow(tx), { onConflict: 'id' })
  if (error) throw error
}

const PUSH_ORDER: Record<SyncTable, number> = {
  profiles: 0,
  categories: 1,
  transactions: 2,
}

async function pushOutbox(userId: string) {
  const entries = await db.outbox.where('userId').equals(userId).toArray()
  entries.sort(
    (a, b) =>
      PUSH_ORDER[a.table] - PUSH_ORDER[b.table] ||
      a.createdAt.localeCompare(b.createdAt),
  )

  for (const entry of entries.slice(0, 120)) {
    try {
      await pushEntry(entry)
      await db.outbox.delete(entry.id)
    } catch (error) {
      const attempts = entry.attempts + 1
      const message = messageOf(error)
      await db.outbox.update(entry.id, { attempts, lastError: message })
      throw new Error(message)
    }
  }
}

function pendingKeys(entries: OutboxEntry[]) {
  return new Set(entries.map((entry) => `${entry.table}:${entry.rowId}`))
}

async function mergeProfile(userId: string, pending: Set<string>) {
  if (pending.has(`profiles:${userId}`)) return
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return
  const remote = profileFromRow(data as ProfileRow)
  const local = await db.profiles.get(userId)
  if (local && !newer(remote.updatedAt, local.updatedAt)) return
  await db.profiles.put(remote)
  if (remote.ledgerId) await ensureLedger(remote)
}

async function mergeCategories(ledgerId: string, pending: Set<string>) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('ledger_id', ledgerId)
  if (error) throw error
  const rows = (data ?? []) as CategoryRow[]

  for (const row of rows) {
    if (pending.has(`categories:${row.id}`)) continue
    const remote = categoryFromRow(row)
    const local = await db.categories.get(row.id)
    if (local && !newer(remote.updatedAt, local.updatedAt)) continue
    await db.categories.put(remote)
  }
}

async function mergeTransactions(ledgerId: string, pending: Set<string>) {
  const pageSize = 500
  let from = 0

  for (;;) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('ledger_id', ledgerId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw error

    const rows = (data ?? []) as TransactionRow[]
    for (const row of rows) {
      if (pending.has(`transactions:${row.id}`)) continue
      const remote = transactionFromRow(row)
      const local = await db.transactions.get(row.id)
      if (local && !newer(remote.updatedAt, local.updatedAt)) continue
      await db.transactions.put(remote)
    }

    if (rows.length < pageSize) break
    from += pageSize
  }
}

async function pullAll(userId: string) {
  const entries = await db.outbox.where('userId').equals(userId).toArray()
  const pending = pendingKeys(entries)
  await mergeProfile(userId, pending)

  const profile = await db.profiles.get(userId)
  if (!profile?.ledgerId) return

  await mergeCategories(profile.ledgerId, pending)
  await mergeTransactions(profile.ledgerId, pending)
}

async function runSync() {
  if (!supabaseConfigured || running) return
  if (!isOnline()) {
    emit({ phase: 'offline' })
    return
  }

  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return

  running = true
  emit({ phase: 'syncing', error: null })
  try {
    await pushOutbox(userId)
    await pullAll(userId)
    const now = new Date().toISOString()
    await setMeta(`sync:last:${userId}`, now)
    emit({ phase: 'idle', lastSync: now, error: null })
    if ((await db.outbox.where('userId').equals(userId).count()) > 0) requestSync()
  } catch (error) {
    emit({ phase: 'error', error: messageOf(error) })
  } finally {
    running = false
  }
}

export async function syncNow() {
  if (timer !== null && typeof window !== 'undefined') {
    window.clearTimeout(timer)
    timer = null
  }
  await runSync()
}

export async function loadSyncMeta(userId: string) {
  const last = await getMeta(`sync:last:${userId}`)
  emit({ lastSync: last ?? null })
}

export function syncPhaseLabel(phase: SyncPhase) {
  switch (phase) {
    case 'syncing':
      return 'Sincronizando'
    case 'offline':
      return 'Sin conexión'
    case 'error':
      return 'Error de sync'
    case 'disabled':
      return 'Supabase no configurado'
    default:
      return 'Al día'
  }
}

