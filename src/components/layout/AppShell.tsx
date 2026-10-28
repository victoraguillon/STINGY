import {
  ChartBar,
  GearSix,
  House,
  ListDashes,
  Moon,
  Plus,
  Sun,
  WifiSlash,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQuickAdd } from '../../app/quick-add'
import { useTheme } from '../../app/theme'
import type { Profile } from '../../db/types'
import { cn } from '../../lib/cn'
import { initials } from '../../lib/format'
import { BrandLockup, CoinMark } from '../Brand'

const navItems = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/movimientos', label: 'Movimientos', icon: ListDashes, end: false },
  { to: '/reportes', label: 'Reportes', icon: ChartBar, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: GearSix, end: false },
]

function OfflineBar() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="flex items-center justify-center gap-2 border-b border-rule bg-paper-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
      <WifiSlash size={13} weight="bold" />
      Sin señal. Tus datos siguen aquí.
    </div>
  )
}

export function AppShell({ profile }: { profile: Profile }) {
  const { open } = useQuickAdd()
  const { resolved, setChoice } = useTheme()

  return (
    <div className="min-h-dvh bg-paper">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[84px] flex-col items-center border-r border-rule bg-paper py-5 md:flex">
        <NavLink to="/" aria-label="Inicio" className="text-ink">
          <CoinMark size={27} />
        </NavLink>

        <nav className="mt-10 flex flex-1 flex-col items-center gap-1.5" aria-label="Principal">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex h-[54px] w-[66px] flex-col items-center justify-center gap-1 rounded-btn transition-colors',
                    isActive ? 'text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-lime transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <Icon size={19} weight={isActive ? 'fill' : 'regular'} />
                    <span className="font-mono text-[8px] uppercase tracking-[0.08em]">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setChoice(resolved === 'dark' ? 'light' : 'dark')}
            aria-label={resolved === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            className="flex h-10 w-10 items-center justify-center rounded-btn text-muted transition-colors hover:bg-paper-2 hover:text-ink"
          >
            {resolved === 'dark' ? (
              <Sun size={18} weight="bold" />
            ) : (
              <Moon size={18} weight="bold" />
            )}
          </button>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 bg-surface font-mono text-[10px] font-medium text-ink"
            title={profile.name}
          >
            {initials(profile.name)}
          </div>
        </div>
      </aside>

      <div className="md:pl-[84px]">
        <OfflineBar />
        <header className="flex items-center justify-between px-5 pb-1 pt-4 md:hidden">
          <BrandLockup coinSize={18} textClassName="text-[18px]" />
          <div className="flex items-center gap-2">
            {profile.demo && (
              <span className="rounded-full border border-rule px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                Ejemplo
              </span>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 bg-surface font-mono text-[9px] font-medium text-ink">
              {initials(profile.name)}
            </div>
          </div>
        </header>

        <main
          id="contenido"
          className="mx-auto w-full max-w-[1180px] px-5 pb-28 pt-3 md:px-8 md:pb-16 md:pt-10 lg:px-10"
        >
          <Outlet />
        </main>
      </div>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-safe md:hidden"
      >
        <div className="grid h-16 grid-cols-5 items-stretch">
          {navItems.slice(0, 2).map((item) => (
            <MobileNavItem key={item.to} {...item} />
          ))}

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => open({ kind: 'expense' })}
              aria-label="Anotar movimiento"
              className="-translate-y-3 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-ink bg-lime text-[#15160F] transition-transform active:translate-y-[-11px]"
            >
              <Plus size={22} weight="bold" />
            </button>
          </div>

          {navItems.slice(2).map((item) => (
            <MobileNavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: typeof House
  end: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative flex flex-col items-center justify-center gap-1 transition-colors',
          isActive ? 'text-ink' : 'text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-0 h-[2px] w-6 rounded-full bg-lime transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
          <span className="font-mono text-[8px] uppercase tracking-[0.06em]">{label}</span>
        </>
      )}
    </NavLink>
  )
}
