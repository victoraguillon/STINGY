import { useCallback, useEffect, useRef, useState } from 'react'
import type { Profile } from '../db/types'
import { supabase, supabaseConfigured } from '../lib/supabase'

export const TELEGRAM_BOT_USERNAME = 'stingyve_bot'

export function telegramDeepLink(code: string) {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(code)}`
}

export type TelegramStatus =
  | 'unavailable'
  | 'offline'
  | 'loading'
  | 'disconnected'
  | 'waiting'
  | 'connected'
  | 'error'

export interface TelegramLink {
  chatId: number
  username: string | null
  linkedAt: string
}

interface LinkRow {
  chat_id: number | null
  username: string | null
  linked_at: string
  revoked_at: string | null
}

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'No pude hablar con Telegram. Intenta de nuevo.'
}

function online() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export function useTelegram(profile: Profile, userId: string | null) {
  const available = !profile.demo && supabaseConfigured && Boolean(userId)
  const [status, setStatus] = useState<TelegramStatus>(available ? 'loading' : 'unavailable')
  const [link, setLink] = useState<TelegramLink | null>(null)
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const codeRef = useRef<string | null>(null)

  useEffect(() => {
    codeRef.current = code
  }, [code])

  const refresh = useCallback(
    async (silent = false) => {
      if (!available || !userId) {
        setStatus('unavailable')
        setLink(null)
        return
      }
      if (!online()) {
        setStatus('offline')
        return
      }
      if (!silent) setStatus((current) => (current === 'connected' ? current : 'loading'))
      const { data, error: queryError } = await supabase
        .from('telegram_links')
        .select('chat_id, username, linked_at, revoked_at')
        .eq('user_id', userId)
        .maybeSingle()

      if (queryError) {
        setError(messageOf(queryError))
        setStatus('error')
        return
      }

      const row = data as LinkRow | null
      const active = row?.chat_id && !row.revoked_at
      if (active) {
        setLink({
          chatId: row.chat_id as number,
          username: row.username,
          linkedAt: row.linked_at,
        })
        setCode(null)
        setExpiresAt(null)
        setError(null)
        setStatus('connected')
        return
      }

      setLink(null)
      setError(null)
      if (!silent) setStatus(codeRef.current ? 'waiting' : 'disconnected')
    },
    [available, userId],
  )

  useEffect(() => {
    if (!available) {
      setStatus('unavailable')
      setLink(null)
      return
    }
    void refresh()
    const onOnline = () => {
      void refresh()
    }
    const onOffline = () => setStatus('offline')
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [available, refresh])

  useEffect(() => {
    if (!available || !code || !expiresAt || link) return
    const timer = window.setInterval(() => {
      if (Date.now() > new Date(expiresAt).getTime()) {
        setCode(null)
        setExpiresAt(null)
        setStatus('disconnected')
        return
      }
      void refresh(true)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [available, code, expiresAt, link, refresh])

  const createCode = useCallback(async () => {
    if (!available || !userId) {
      throw new Error('El ejemplo no se conecta a Telegram. Usa una cuenta real.')
    }
    if (!online()) throw new Error('Necesitas conexión para generar el código.')
    setBusy(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('create_telegram_link_code')
      if (rpcError) throw new Error(messageOf(rpcError))
      const next = String(data ?? '').trim().toUpperCase()
      if (!next) throw new Error('Supabase no devolvió un código.')
      setCode(next)
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000).toISOString())
      setStatus('waiting')
      return next
    } finally {
      setBusy(false)
    }
  }, [available, userId])

  const disconnect = useCallback(async () => {
    if (!userId) throw new Error('No hay una cuenta abierta.')
    if (!online()) throw new Error('Necesitas conexión para desvincular Telegram.')
    setBusy(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('telegram_links')
        .update({
          chat_id: null,
          username: null,
          revoked_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
      if (updateError) throw new Error(messageOf(updateError))
      setLink(null)
      setCode(null)
      setExpiresAt(null)
      setStatus('disconnected')
    } finally {
      setBusy(false)
    }
  }, [userId])

  return {
    available,
    status,
    link,
    code,
    expiresAt,
    error,
    busy,
    refresh,
    createCode,
    disconnect,
  }
}
