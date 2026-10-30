import { useEffect } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { QuickAddProvider } from './app/quick-add'
import { SessionProvider, useSession } from './app/session'
import { ToastProvider } from './app/toast'
import { BrandLockup } from './components/Brand'
import { AppShell } from './components/layout/AppShell'
import { EmptyState } from './components/ui/EmptyState'
import { AuthScreen } from './screens/AuthScreen'
import { DesignSystemScreen } from './screens/DesignSystemScreen'
import { HomeScreen } from './screens/HomeScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { ReportsScreen } from './screens/ReportsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { TransactionsScreen } from './screens/TransactionsScreen'
import { ensureRates } from './lib/rates'

const TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/movimientos': 'Movimientos',
  '/reportes': 'Reportes',
  '/ajustes': 'Ajustes',
  '/design': 'Sistema de diseño',
}

function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    const label = TITLES[location.pathname]
    document.title = label ? `${label} — stingy` : 'stingy — Gasta con intención'
  }, [location.pathname])

  return null
}

function LoadingBook() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col justify-center px-5 md:px-10">
        <BrandLockup coinSize={24} textClassName="text-[24px]" />
        <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Abriendo el libro
        </p>
        <div className="mt-3 h-px w-[180px] overflow-hidden bg-rule">
          <span className="block h-px w-1/2 animate-pulse bg-ink" />
        </div>
      </div>
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div className="flex flex-col gap-8">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
        404 · fuera del libro
      </p>
      <EmptyState
        title="Esta página no está en tu libro."
        body="Puede que el enlace esté viejo o que la pantalla todavía no exista. Vuelve al resumen y sigue desde ahí."
        action={
          <Link
            to="/"
            className="inline-flex h-11 items-center rounded-btn border border-ink bg-lime px-3 text-[13px] font-medium text-[#15160F] md:h-9"
          >
            Volver al inicio
          </Link>
        }
      />
    </div>
  )
}

function SessionGate() {
  const { mode, profile, loadingProfile } = useSession()

  if (mode === 'loading' || loadingProfile) return <LoadingBook />
  if (!profile) return <AuthScreen />
  if (!profile.onboardingComplete) return <OnboardingScreen profile={profile} />

  return (
    <QuickAddProvider profile={profile}>
      <Routes>
        <Route element={<AppShell profile={profile} />}>
          <Route index element={<HomeScreen profile={profile} />} />
          <Route path="movimientos" element={<TransactionsScreen profile={profile} />} />
          <Route path="reportes" element={<ReportsScreen profile={profile} />} />
          <Route path="ajustes" element={<SettingsScreen profile={profile} />} />
          <Route path="design" element={<DesignSystemScreen profile={profile} />} />
          <Route path="*" element={<NotFoundScreen />} />
        </Route>
      </Routes>
    </QuickAddProvider>
  )
}

export default function App() {
  useEffect(() => {
    void ensureRates()
  }, [])

  return (
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <RouteEffects />
          <SessionGate />
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

