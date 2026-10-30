import { useLiveQuery } from 'dexie-react-hooks'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  clearDemoData,
  clearUserData,
  db,
  deleteMeta,
  ensureLedger,
  getMeta,
  setMeta,
} from '../db/db'
import { DEMO_PROFILE_ID } from '../db/defaults'
import { saveProfile } from '../db/repo'
import { seedDemo } from '../db/seed'
import type { Currency, Profile, RateType } from '../db/types'
import { supabase, supabaseConfigured } from '../lib/supabase'
import {
  loadSyncMeta,
  pullProfile,
  requestSync,
  startSync,
  stopSync,
  syncNow,
} from '../sync/engine'

type SessionMode = 'loading' | 'signedOut' | 'demo' | 'account'

interface SessionValue {
  mode: SessionMode
  userId: string | null
  profile: Profile | null
  loadingProfile: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  enterDemo: () => Promise<void>
  exitDemo: () => Promise<void>
  deleteAccount: () => Promise<void>
  completeOnboarding: (
    name: string,
    baseCurrency: Currency,
    defaultRateType: RateType,
  ) => Promise<void>
  updateProfile: (patch: Partial<Profile>) => Promise<void>
  retry: () => Promise<void>
  refreshSync: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

function messageOf(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Algo salió mal. Intenta de nuevo.'
}

function authMessage(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Ya existe una cuenta con ese correo. Entra en su lugar.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirma tu correo antes de entrar.'
  }
  if (lower.includes('password should be')) {
    return 'La contraseña necesita al menos 6 caracteres.'
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Demasiados intentos. Espera un minuto y vuelve a probar.'
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'No hay conexión con el servidor. Revisa tu internet.'
  }
  return message
}

function online() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SessionMode>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const modeRef = useRef(mode)
  const userIdRef = useRef(userId)
  const openingRef = useRef<string | null>(null)
  modeRef.current = mode
  userIdRef.current = userId

  const profileKey =
    mode === 'demo' ? DEMO_PROFILE_ID : mode === 'account' ? userId : null

  const profileResult = useLiveQuery(
    async () => {
      if (!profileKey) return { profile: null as Profile | null }
      return { profile: (await db.profiles.get(profileKey)) ?? null }
    },
    [profileKey],
  )

  const profile = profileResult?.profile ?? null
  const loadingProfile = profileKey !== null && profileResult === undefined

  const openAccount = useCallback(async (id: string) => {
    if (openingRef.current === id) return
    openingRef.current = id
    setError(null)
    setMode('loading')
    setUserId(id)
    try {
      let local: Profile | null = (await db.profiles.get(id)) ?? null
      if (!local) {
        if (!online()) {
          throw new Error(
            'Esta cuenta todavía no está en este dispositivo. Conéctate una vez para abrirla.',
          )
        }
        local = await pullProfile(id)
      }
      if (!local) {
        throw new Error(
          'No encontramos tu perfil. Vuelve a intentar en unos segundos.',
        )
      }
      await ensureLedger(local)
      await loadSyncMeta(id)
      setMode('account')
      startSync()
      requestSync()
    } catch (caught) {
      setError(messageOf(caught))
      setMode('signedOut')
      setUserId(null)
    } finally {
      openingRef.current = null
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function boot() {
      const demoActive = (await getMeta('demo:active')) === '1'
      if (demoActive) {
        const demo = await db.profiles.get(DEMO_PROFILE_ID)
        if (demo) {
          if (alive) setMode('demo')
          return
        }
        await deleteMeta('demo:active')
      }

      if (!supabaseConfigured) {
        if (alive) setMode('signedOut')
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!alive) return
      if (data.session?.user) {
        await openAccount(data.session.user.id)
      } else {
        setMode('signedOut')
      }
    }

    void boot()

    const subscription = supabaseConfigured
      ? supabase.auth.onAuthStateChange((event, session) => {
          if (modeRef.current === 'demo') return
          if (event === 'SIGNED_OUT') {
            setMode('signedOut')
            setUserId(null)
            stopSync()
            return
          }
          const nextId = session?.user?.id
          if (!nextId || event === 'INITIAL_SESSION') return
          if (modeRef.current === 'account' && userIdRef.current === nextId) return
          void openAccount(nextId)
        })
      : null

    return () => {
      alive = false
      subscription?.data.subscription.unsubscribe()
      stopSync()
    }
  }, [openAccount])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabaseConfigured) {
        throw new Error(
          'No se pudo iniciar sesión. Intenta de nuevo en unos segundos.',
        )
      }
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (authError) throw new Error(authMessage(authError.message))
      if (data.user) await openAccount(data.user.id)
    },
    [openAccount],
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!supabaseConfigured) {
        throw new Error(
          'No se pudo crear la cuenta. Intenta de nuevo en unos segundos.',
        )
      }
      const clean = email.trim().toLowerCase()
      const { data, error: authError } = await supabase.auth.signUp({
        email: clean,
        password,
        options: {
          data: { name: clean.split('@')[0] ?? 'Sin nombre' },
        },
      })
      if (authError) throw new Error(authMessage(authError.message))
      if (!data.session?.user) {
        throw new Error(
          'La cuenta se creó, pero no se pudo abrir la sesión. Inicia sesión con tu correo.',
        )
      }
      await openAccount(data.session.user.id)
    },
    [openAccount],
  )

  const signOut = useCallback(async () => {
    if (modeRef.current === 'demo') {
      await clearDemoData()
      await deleteMeta('demo:active')
      setMode('signedOut')
      setUserId(null)
      return
    }
    await supabase.auth.signOut()
    stopSync()
    setMode('signedOut')
    setUserId(null)
  }, [])

  const enterDemo = useCallback(async () => {
    await seedDemo()
    await setMeta('demo:active', '1')
    stopSync()
    setMode('demo')
    setUserId(null)
    setError(null)
  }, [])

  const exitDemo = useCallback(async () => {
    await clearDemoData()
    await deleteMeta('demo:active')
    if (!supabaseConfigured) {
      setMode('signedOut')
      return
    }
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      await openAccount(data.session.user.id)
    } else {
      setMode('signedOut')
    }
  }, [openAccount])

  const deleteAccount = useCallback(async () => {
    if (!userId || !profile) throw new Error('No hay una cuenta abierta.')
    if (!online()) throw new Error('Necesitas conexión para borrar la cuenta.')
    const { error: rpcError } = await supabase.rpc('delete_own_account')
    if (rpcError) throw new Error(messageOf(rpcError))
    await clearUserData(userId, profile.ledgerId)
    await supabase.auth.signOut()
    stopSync()
    setMode('signedOut')
    setUserId(null)
  }, [profile, userId])

  const completeOnboarding = useCallback(
    async (name: string, baseCurrency: Currency, defaultRateType: RateType) => {
      if (!profile) throw new Error('No hay un perfil abierto.')
      const next: Profile = {
        ...profile,
        name: name.trim(),
        baseCurrency,
        defaultRateType,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      }
      await saveProfile(next)
      if (!profile.demo && supabaseConfigured && online()) {
        const { error: rpcError } = await supabase.rpc('complete_onboarding', {
          p_name: next.name,
          p_base_currency: baseCurrency,
          p_default_rate_type: defaultRateType,
        })
        if (rpcError) {
          // La fila ya quedó en la cola local; el sync la reintenta.
          requestSync()
        }
      }
    },
    [profile],
  )

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!profile) throw new Error('No hay un perfil abierto.')
      await saveProfile({
        ...profile,
        ...patch,
        updatedAt: new Date().toISOString(),
      })
    },
    [profile],
  )

  const retry = useCallback(async () => {
    if (!supabaseConfigured) {
      setMode('signedOut')
      return
    }
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      await openAccount(data.session.user.id)
    } else {
      setMode('signedOut')
    }
  }, [openAccount])

  const refreshSync = useCallback(async () => {
    await syncNow()
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      mode,
      userId,
      profile,
      loadingProfile,
      error,
      signIn,
      signUp,
      signOut,
      enterDemo,
      exitDemo,
      deleteAccount,
      completeOnboarding,
      updateProfile,
      retry,
      refreshSync,
    }),
    [
      mode,
      userId,
      profile,
      loadingProfile,
      error,
      signIn,
      signUp,
      signOut,
      enterDemo,
      exitDemo,
      deleteAccount,
      completeOnboarding,
      updateProfile,
      retry,
      refreshSync,
    ],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession debe usarse dentro de SessionProvider')
  return value
}
