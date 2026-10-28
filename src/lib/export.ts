import type { Category, Profile, Tx } from '../db/types'
import { RATE_LABEL } from './fx'

function download(filename: string, contents: string, mime: string) {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function stamp() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
}

export interface ExportBundle {
  profile: Profile
  categories: Category[]
  transactions: Tx[]
}

export function exportJson(bundle: ExportBundle) {
  const payload = {
    app: 'stingy',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: bundle.profile,
    categories: bundle.categories,
    transactions: bundle.transactions,
  }
  download(`stingy-${stamp()}.json`, JSON.stringify(payload, null, 2), 'application/json')
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function exportCsv(bundle: ExportBundle) {
  const categoryNames = new Map(bundle.categories.map((entry) => [entry.id, entry.name]))
  const header = [
    'fecha',
    'tipo',
    'concepto',
    'categoria',
    'monto',
    'moneda',
    'tasa',
    'tasa_tipo',
    'monto_usd',
    'origen',
  ]
  const rows = [...bundle.transactions]
    .sort((a, b) => (a.occurredOn < b.occurredOn ? -1 : a.occurredOn > b.occurredOn ? 1 : 0))
    .map((tx) => [
      tx.occurredOn,
      tx.kind === 'income' ? 'ingreso' : 'gasto',
      tx.note,
      categoryNames.get(tx.categoryId) ?? 'Otros',
      tx.amount.toFixed(2).replace('.', ','),
      tx.currency,
      tx.rate.toFixed(4).replace('.', ','),
      RATE_LABEL[tx.rateType],
      tx.amountUsd.toFixed(2).replace('.', ','),
      tx.source,
    ])
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n')
  download(`stingy-${stamp()}.csv`, csv, 'text/csv')
}
