// Bot de Telegram de Stingy.
// Recibe updates por webhook, vincula un chat con una cuenta y anota movimientos.
// Secretos: TELEGRAM_BOT_TOKEN y TELEGRAM_WEBHOOK_SECRET.
// Desplegar con: supabase functions deploy telegram-webhook --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2'

const TIME_ZONE = 'America/Caracas'
const MAX_MESSAGE = 500

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-telegram-bot-api-secret-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TelegramUser {
  username?: string
  first_name?: string
}

interface TelegramChat {
  id: number
  type: string
}

interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  text?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

interface ProfileRow {
  id: string
  name: string
  default_ledger_id: string | null
  base_currency: 'VES' | 'USD'
  default_rate_type: 'bcv' | 'paralelo'
}

interface CategoryRow {
  id: string
  name: string
  kind: 'expense' | 'income'
  position: number
}

interface ParsedMovement {
  kind: 'expense' | 'income'
  amount: number
  currency: 'VES' | 'USD'
  rateType: 'bcv' | 'paralelo'
  occurredOn: string
  category: CategoryRow | null
  note: string
}

const money = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

function caracasDate(offsetDays = 0) {
  const parts = DATE_FORMAT.formatToParts(new Date())
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0')
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '0')
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '0')
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays))
  return date.toISOString().slice(0, 10)
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatMoney(value: number, currency: 'VES' | 'USD') {
  return `${currency === 'USD' ? '$' : 'Bs'} ${money.format(value)}`
}

function formatUsd(value: number) {
  return `$ ${money.format(value)}`
}

function parseAmount(raw: string): number | null {
  let text = raw.replace(/\s/g, '')
  if (!text || !/\d/.test(text)) return null

  const lastComma = text.lastIndexOf(',')
  const lastDot = text.lastIndexOf('.')

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      text = text.replace(/\./g, '').replace(',', '.')
    } else {
      text = text.replace(/,/g, '')
    }
  } else if (lastComma !== -1) {
    const decimals = text.length - lastComma - 1
    text = decimals > 0 && decimals <= 2 ? text.replace(',', '.') : text.replace(/,/g, '')
  } else if (lastDot !== -1) {
    const decimals = text.length - lastDot - 1
    const dots = (text.match(/\./g) ?? []).length
    if (dots > 1 || decimals === 0 || decimals > 3) {
      text = text.replace(/\./g, '')
    } else if (decimals === 3) {
      text = text.replace(/\./g, '')
    }
  }

  const value = Number(text)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100) / 100
}

function hasWord(haystack: string, word: string) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[\\s.,;:!?])${escaped}([\\s.,;:!?]|$)`, 'i').test(haystack)
}

const ALIASES: Record<string, string[]> = {
  comida: ['mercado', 'supermercado', 'restaurante', 'almuerzo', 'cena'],
  transporte: ['taxi', 'metro', 'bus', 'gasolina'],
  hogar: ['alquiler', 'casa'],
  servicios: ['luz', 'agua', 'internet', 'telefono'],
  salud: ['farmacia', 'medico'],
  ocio: ['cine', 'salida'],
  compras: ['ropa'],
  mascotas: ['perro', 'gato'],
  sueldo: ['salario'],
  freelance: ['freelance'],
  ventas: ['ventas'],
  'otros ingresos': ['ingreso'],
}

function findCategory(
  normalizedText: string,
  categories: CategoryRow[],
  kind: 'expense' | 'income',
) {
  const pool = categories.filter((category) => category.kind === kind)
  const byName = [...pool].sort((a, b) => normalize(b.name).length - normalize(a.name).length)
  for (const category of byName) {
    if (hasWord(normalizedText, normalize(category.name))) return category
  }

  for (const category of pool) {
    const aliases = ALIASES[normalize(category.name)] ?? []
    for (const alias of aliases) {
      if (hasWord(normalizedText, alias)) return category
    }
  }

  const fallbackName = kind === 'income' ? 'otros ingresos' : 'otros'
  return pool.find((category) => normalize(category.name) === fallbackName) ?? pool[0] ?? null
}

function parseMovement(
  text: string,
  profile: ProfileRow,
  categories: CategoryRow[],
): ParsedMovement | string {
  const original = text.trim().replace(/\s+/g, ' ')
  const normalized = normalize(original)
  const income = original.startsWith('+') || /^ingreso\b/i.test(normalized)
  const kind = income ? 'income' : 'expense'
  const cleaned = income ? original.replace(/^\+/, '').replace(/^ingreso\b/i, '').trim() : original

  const tokens = cleaned.split(/\s+/).filter(Boolean)
  const amountPattern = /^\$?(\d[\d.,]*)(\$|bs|bolivares|bolívares|ves|bf|usd|dolares|dólares)?$/i
  let amountIndex = -1
  let amount: number | null = null
  let suffixCurrency: 'VES' | 'USD' | null = null

  for (let index = 0; index < tokens.length; index += 1) {
    const match = tokens[index].match(amountPattern)
    if (!match) continue
    const parsed = parseAmount(match[1])
    if (parsed === null) continue
    amount = parsed
    amountIndex = index
    const suffix = normalize(match[2] ?? '')
    if (suffix === 'usd' || suffix === 'dolares' || suffix === '$') suffixCurrency = 'USD'
    if (suffix === 'bs' || suffix === 'bolivares' || suffix === 'ves' || suffix === 'bf') {
      suffixCurrency = 'VES'
    }
    break
  }

  if (amount === null || amountIndex < 0) {
    return 'No encontré un monto. Ejemplo: Mercado 12511 bolivares bcv'
  }

  const hasUsd = /\$|\busd\b|\bdolar(es)?\b/.test(normalized)
  const hasVes = /\bbs\b|\bbolivar(es)?\b|\bves\b|\bbf\b/.test(normalized)
  let currency: 'VES' | 'USD' = profile.base_currency
  if (suffixCurrency) currency = suffixCurrency
  else if (hasUsd && !hasVes) currency = 'USD'
  else if (hasVes && !hasUsd) currency = 'VES'

  const bcvIndex = normalized.indexOf('bcv')
  const parallelIndex = normalized.indexOf('paralelo')
  let rateType: 'bcv' | 'paralelo' = profile.default_rate_type
  if (bcvIndex !== -1 || parallelIndex !== -1) {
    rateType = parallelIndex > bcvIndex ? 'paralelo' : 'bcv'
  }

  const occurredOn = hasWord(normalized, 'ayer') ? caracasDate(-1) : caracasDate(0)
  const category = findCategory(normalized, categories, kind)

  const stop = new Set([
    'hoy',
    'ayer',
    'bcv',
    'paralelo',
    'bs',
    'bolivar',
    'bolivares',
    'ves',
    'bf',
    'usd',
    'dolar',
    'dolares',
    '$',
    '+',
    'ingreso',
    'gasto',
  ])
  const categoryWords = new Set(
    category ? normalize(category.name).split(/\s+/).filter(Boolean) : [],
  )
  const note = tokens
    .filter((token, index) => {
      if (index === amountIndex) return false
      const clean = normalize(token.replace(/^[.,;:!?]+|[.,;:!?]+$/g, ''))
      return clean.length > 0 && !stop.has(clean) && !categoryWords.has(clean)
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)

  return {
    kind,
    amount,
    currency,
    rateType,
    occurredOn,
    category,
    note: note || category?.name || (kind === 'income' ? 'Ingreso' : 'Gasto'),
  }
}

async function sendMessage(chatId: number, text: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) return false
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    })
    return response.ok
  } catch {
    return false
  }
}

const HELP = [
  'Anota en una línea. Sin emojis.',
  '',
  'Gasto: Mercado 12511 bolivares bcv',
  'Ingreso: +Freelance 110 dolares paralelo',
  'Ayer: Taxi 50 bs ayer',
  '',
  'Moneda: bs, bolivares, ves, $, dolares, usd.',
  'Tasa: bcv o paralelo. Si falta, uso la de tu perfil.',
  'Categoría: por nombre. Si no la reconozco, va a Otros.',
  '',
  'Comandos: /estado, /desvincular, /ayuda.',
].join('\n')

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (request.method !== 'POST') return json({ ok: false, error: 'Método no permitido.' }, 405)

  const secret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')
  const provided = request.headers.get('x-telegram-bot-api-secret-token')
  if (!secret || provided !== secret) return json({ ok: false, error: 'No autorizado.' }, 401)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRole) {
    return json({ ok: false, error: 'Faltan variables de Supabase.' }, 500)
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return json({ ok: false, error: 'JSON inválido.' }, 400)
  }

  const message = update.message
  if (!message?.text) return json({ ok: true, ignored: true })
  if (message.chat.type !== 'private') {
    await sendMessage(message.chat.id, 'Solo funciono en chat privado con una cuenta de Stingy.')
    return json({ ok: true })
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const chatId = message.chat.id
  const username = message.from?.username ?? null
  const text = message.text.trim().slice(0, MAX_MESSAGE)
  const commandMatch = text.match(/^\/([a-z]+)(?:@\w+)?(?:\s+(.*))?$/i)

  if (commandMatch) {
    const command = commandMatch[1].toLowerCase()
    const argument = (commandMatch[2] ?? '').trim()

    if (command === 'start') {
      if (!argument) {
        const { data: link } = await supabase
          .from('telegram_links')
          .select('user_id')
          .eq('chat_id', chatId)
          .is('revoked_at', null)
          .maybeSingle()
        if (link) {
          await sendMessage(
            chatId,
            'Este chat ya está vinculado. Envía una línea como Mercado 12511 bolivares bcv o usa /ayuda.',
          )
        } else {
          await sendMessage(
            chatId,
            'Para vincular, abre Ajustes en Stingy, genera un código y envíame /start CODIGO.',
          )
        }
        return json({ ok: true })
      }

      const code = argument.split(/\s+/)[0].toUpperCase()
      const now = new Date().toISOString()
      const { data: claimed } = await supabase
        .from('telegram_link_codes')
        .update({ used_at: now })
        .eq('code', code)
        .is('used_at', null)
        .gt('expires_at', now)
        .select('user_id')
        .maybeSingle()

      if (!claimed?.user_id) {
        await sendMessage(chatId, 'Ese código no sirve o ya venció. Genera uno nuevo en Ajustes.')
        return json({ ok: true })
      }

      const { data: chatLink } = await supabase
        .from('telegram_links')
        .select('user_id')
        .eq('chat_id', chatId)
        .is('revoked_at', null)
        .maybeSingle()

      if (chatLink && chatLink.user_id !== claimed.user_id) {
        await sendMessage(
          chatId,
          'Este chat ya está vinculado a otra cuenta. Envía /desvincular primero.',
        )
        return json({ ok: true })
      }

      await supabase
        .from('telegram_links')
        .update({ chat_id: null, username: null, revoked_at: now })
        .eq('user_id', claimed.user_id)
        .not('chat_id', 'is', null)

      const { error: linkError } = await supabase.from('telegram_links').upsert(
        {
          user_id: claimed.user_id,
          chat_id: chatId,
          username,
          linked_at: now,
          revoked_at: null,
        },
        { onConflict: 'user_id' },
      )

      if (linkError) {
        await sendMessage(chatId, 'No pude vincular el chat. Intenta de nuevo en un minuto.')
        return json({ ok: true })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', claimed.user_id)
        .maybeSingle()

      await sendMessage(
        chatId,
        `Listo. Este chat quedó vinculado a ${profile?.name || 'tu cuenta'}.\n\nEnvía una línea como Mercado 12511 bolivares bcv. Usa /ayuda para ver la gramática.`,
      )
      return json({ ok: true })
    }

    if (command === 'ayuda' || command === 'help') {
      await sendMessage(chatId, HELP)
      return json({ ok: true })
    }

    if (command === 'desvincular') {
      const { data: link } = await supabase
        .from('telegram_links')
        .select('user_id')
        .eq('chat_id', chatId)
        .is('revoked_at', null)
        .maybeSingle()
      if (!link) {
        await sendMessage(chatId, 'Este chat no está vinculado a ninguna cuenta.')
        return json({ ok: true })
      }
      const { error } = await supabase
        .from('telegram_links')
        .update({
          chat_id: null,
          username: null,
          revoked_at: new Date().toISOString(),
        })
        .eq('user_id', link.user_id)
      await sendMessage(
        chatId,
        error
          ? 'No pude desvincular el chat. Intenta de nuevo.'
          : 'Listo. Este chat ya no está vinculado. Tus movimientos siguen en la app.',
      )
      return json({ ok: true })
    }

    if (command === 'estado') {
      const { data: link } = await supabase
        .from('telegram_links')
        .select('user_id')
        .eq('chat_id', chatId)
        .is('revoked_at', null)
        .maybeSingle()
      if (!link) {
        await sendMessage(chatId, 'Este chat no está vinculado. Abre Ajustes en Stingy.')
        return json({ ok: true })
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, default_ledger_id, default_rate_type')
        .eq('id', link.user_id)
        .maybeSingle()
      if (!profile?.default_ledger_id) {
        await sendMessage(chatId, 'La cuenta no tiene un libro activo.')
        return json({ ok: true })
      }

      const today = caracasDate(0)
      const monthStart = `${today.slice(0, 8)}01`
      const { data: rows } = await supabase
        .from('transactions')
        .select('kind, amount_usd')
        .eq('ledger_id', profile.default_ledger_id)
        .gte('occurred_on', monthStart)
        .lte('occurred_on', today)
        .is('deleted_at', null)

      const movements = rows ?? []
      const expenses = movements
        .filter((row) => row.kind === 'expense')
        .reduce((sum, row) => sum + Number(row.amount_usd), 0)
      const incomes = movements
        .filter((row) => row.kind === 'income')
        .reduce((sum, row) => sum + Number(row.amount_usd), 0)

      await sendMessage(
        chatId,
        [
          'Estado de Stingy',
          `Cuenta: ${profile.name}`,
          `Vinculado como @${username ?? 'sin usuario'}`,
          `Tasa por defecto: ${profile.default_rate_type === 'bcv' ? 'BCV' : 'paralelo'}`,
          '',
          `Este mes: ${movements.length} ${movements.length === 1 ? 'movimiento' : 'movimientos'}`,
          `Gastos: ${formatUsd(expenses)}`,
          `Ingresos: ${formatUsd(incomes)}`,
        ].join('\n'),
      )
      return json({ ok: true })
    }

    await sendMessage(chatId, 'No conozco ese comando. Usa /ayuda.')
    return json({ ok: true })
  }

  const { data: duplicate } = await supabase
    .from('transactions')
    .select('id')
    .eq('telegram_update_id', update.update_id)
    .maybeSingle()
  if (duplicate) return json({ ok: true, duplicate: true })

  const { data: link } = await supabase
    .from('telegram_links')
    .select('user_id')
    .eq('chat_id', chatId)
    .is('revoked_at', null)
    .maybeSingle()
  if (!link) {
    await sendMessage(
      chatId,
      'Este chat no está vinculado. Abre Ajustes en Stingy, genera un código y envía /start CODIGO.',
    )
    return json({ ok: true })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, default_ledger_id, base_currency, default_rate_type')
    .eq('id', link.user_id)
    .maybeSingle<ProfileRow>()
  if (!profile?.default_ledger_id) {
    await sendMessage(chatId, 'La cuenta no tiene un libro activo.')
    return json({ ok: true })
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, kind, position')
    .eq('ledger_id', profile.default_ledger_id)
    .is('deleted_at', null)
    .order('position', { ascending: true })

  const parsed = parseMovement(text, profile, (categories ?? []) as CategoryRow[])
  if (typeof parsed === 'string') {
    await sendMessage(chatId, `${parsed}\n\nUsa /ayuda para ver la gramática.`)
    return json({ ok: true })
  }

  const { data: rate } = await supabase
    .from('rates')
    .select('value')
    .eq('type', parsed.rateType)
    .maybeSingle()
  const rateValue = Number(rate?.value)
  if (!Number.isFinite(rateValue) || rateValue <= 0) {
    await sendMessage(chatId, 'No hay tasa disponible. Abre Stingy y actualiza las tasas.')
    return json({ ok: true })
  }

  const amountUsd =
    parsed.currency === 'USD' ? parsed.amount : Math.round((parsed.amount / rateValue) * 100) / 100

  const { error } = await supabase.from('transactions').insert({
    id: crypto.randomUUID(),
    ledger_id: profile.default_ledger_id,
    created_by: profile.id,
    kind: parsed.kind,
    amount: parsed.amount,
    currency: parsed.currency,
    rate_type: parsed.rateType,
    rate: rateValue,
    amount_usd: amountUsd,
    category_id: parsed.category?.id ?? null,
    note: parsed.note,
    occurred_on: parsed.occurredOn,
    source: 'telegram',
    telegram_update_id: update.update_id,
  })

  if (error) {
    if (error.code === '23505') return json({ ok: true, duplicate: true })
    await sendMessage(chatId, 'No pude guardar el movimiento. Intenta de nuevo.')
    return json({ ok: false, error: error.message }, 500)
  }

  const today = caracasDate(0)
  const yesterday = caracasDate(-1)
  const dateLabel =
    parsed.occurredOn === today ? 'hoy' : parsed.occurredOn === yesterday ? 'ayer' : parsed.occurredOn
  const parts = [parsed.category?.name ?? (parsed.kind === 'income' ? 'Otros ingresos' : 'Otros')]
  parts.push(dateLabel)
  if (parsed.note && !parts.some((part) => normalize(part) === normalize(parsed.note))) {
    parts.push(parsed.note)
  }

  const lines = [
    parsed.kind === 'income' ? 'Ingreso anotado' : 'Gasto anotado',
    formatMoney(parsed.amount, parsed.currency),
  ]
  if (parsed.currency === 'VES') {
    lines.push(`${formatUsd(amountUsd)} · ${parsed.rateType === 'bcv' ? 'BCV' : 'paralelo'}`)
  } else {
    lines.push(
      `${formatMoney(Math.round(parsed.amount * rateValue * 100) / 100, 'VES')} · ${
        parsed.rateType === 'bcv' ? 'BCV' : 'paralelo'
      }`,
    )
  }
  lines.push(parts.join(' · '))

  await sendMessage(chatId, lines.join('\n'))
  return json({ ok: true })
})
