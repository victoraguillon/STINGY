import { ArrowRight, Eye, EyeSlash, WarningCircle } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../app/session'
import { BrandLockup } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Segmented } from '../components/ui/Segmented'
import { Stamp } from '../components/ui/Stamp'
import { supabaseConfigured } from '../lib/supabase'

type Mode = 'login' | 'register'

function SampleReceipt() {
  return (
    <div className="mt-9 w-[318px] max-w-full rotate-[-2.5deg]">
      <div className="relative rounded-ticket border-[1.5px] border-ink/20 bg-surface px-4 pb-7 pt-3">
        <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
          <span>Recibo · ejemplo</span>
          <span>26 oct 2026</span>
        </div>
        <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.12em] text-muted">Mercado</p>
        <p className="mt-1 font-mono text-[26px] font-medium leading-none tracking-[-0.04em] text-ink">
          <span className="mr-1 text-[12px] uppercase text-muted">Bs</span>
          12.511,00
        </p>
        <p className="mt-2 font-mono text-[10px] tabular-nums text-muted">
          $ 14,12 BCV · $ 12,47 paralelo
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-rule pt-2 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
          <span>Comida</span>
          <span>Hoy</span>
        </div>
        <div className="mt-3 flex justify-end">
          <Stamp label="Anotado" tone="lime" className="px-2 py-0.5 text-[8px]" />
        </div>
        <div className="receipt-tear" />
      </div>
    </div>
  )
}

export function AuthScreen() {
  const { signIn, signUp, enterDemo, error: sessionError, retry } = useSession()
  const [mode, setMode] = useState<Mode>('register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

  useEffect(() => {
    if (sessionError) setError(sessionError)
  }, [sessionError])

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError('Escribe un correo válido.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña necesita al menos 6 caracteres.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') await signIn(trimmed, password)
      else await signUp(trimmed, password)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar el acceso.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDemo() {
    setError(null)
    setDemoLoading(true)
    try {
      await enterDemo()
    } catch {
      setError('No se pudieron cargar los datos de ejemplo.')
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[55%_45%]">
      <aside className="relative hidden flex-col overflow-hidden bg-paper px-10 py-10 lg:flex xl:px-16">
        <div className="flex items-center justify-between">
          <BrandLockup coinSize={22} textClassName="text-[21px]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
            Venezuela · Bs / $
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Finanzas personales
          </p>
          <h1 className="mt-4 font-display text-[clamp(48px,5.2vw,82px)] font-semibold leading-[0.92] tracking-[-0.055em] text-ink">
            Gasta con
            <br />
            <span className="relative inline-block">
              intención.
              <span className="absolute inset-x-0 -bottom-1 h-[5px] bg-lime" aria-hidden="true" />
            </span>
          </h1>
          <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-ink-2">
            Tus ingresos y gastos en bolívares y dólares, con la tasa del día. Sin
            ruido, sin culpa.
          </p>
          <div className="hidden [@media(min-height:800px)]:block">
            <SampleReceipt />
          </div>
        </div>

        <footer className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
          <span>Hecho para Venezuela</span>
          <span>v0.1.0</span>
        </footer>
      </aside>

      <main className="flex min-h-dvh flex-col bg-paper lg:border-l lg:border-rule lg:bg-surface">
        <div className="flex items-center justify-between px-5 pb-2 pt-5 lg:hidden">
          <BrandLockup coinSize={19} textClassName="text-[19px]" />
          <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
            {supabaseConfigured ? 'Cuenta real' : 'Sin backend'}
          </span>
        </div>

        <div className="px-5 pb-7 pt-8 lg:hidden">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Finanzas personales
          </p>
          <h1 className="mt-3 font-display text-[40px] font-semibold leading-[0.94] tracking-[-0.05em] text-ink">
            Gasta con
            <br />
            <span className="relative inline-block">
              intención.
              <span className="absolute inset-x-0 -bottom-0.5 h-[4px] bg-lime" aria-hidden="true" />
            </span>
          </h1>
          <p className="mt-4 max-w-[38ch] text-[14px] leading-relaxed text-ink-2">
            Tus ingresos y gastos en bolívares y dólares, con la tasa del día.
          </p>
        </div>

        <div className="flex flex-1 items-center border-y border-rule bg-surface px-5 py-9 lg:border-0 lg:bg-transparent lg:px-10 xl:px-16">
          <div className="mx-auto w-full max-w-[380px]">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              Acceso · {supabaseConfigured ? 'Supabase' : 'sin configurar'}
            </p>
            <h2 className="mt-2 font-display text-[30px] font-semibold leading-[1.02] tracking-[-0.04em] text-ink">
              {mode === 'register' ? 'Abre tu libro.' : 'Vuelve a tu libro.'}
            </h2>
            <p className="mt-2 max-w-[38ch] text-[13px] leading-relaxed text-muted">
              {mode === 'register'
                ? 'Una cuenta por persona. Tus números no se mezclan con los de nadie.'
                : 'Entra para seguir anotando donde lo dejaste.'}
            </p>

            {!supabaseConfigured && (
              <div className="mt-5 flex gap-2.5 border-l-2 border-tomato-text bg-tomato/5 py-2 pl-2.5 pr-3">
                <WarningCircle size={16} weight="bold" className="mt-0.5 shrink-0 text-tomato-text" />
              </div>
            )}

            <Segmented
              className="mt-6"
              options={[
                { value: 'login', label: 'Entrar' },
                { value: 'register', label: 'Crear cuenta' },
              ]}
              value={mode}
              onChange={switchMode}
              label="Entrar o crear cuenta"
            />

            <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
              <Field
                label="Correo"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <div className="relative">
                <Field
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center text-muted transition-colors hover:text-ink"
                >
                  {showPassword ? (
                    <EyeSlash size={17} weight="bold" />
                  ) : (
                    <Eye size={17} weight="bold" />
                  )}
                </button>
              </div>

              {error && (
                <div role="alert" className="border-l-2 border-tomato-text pl-2.5">
                  <p className="text-[12px] leading-relaxed text-tomato-text">{error}</p>
                  {sessionError && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null)
                        void retry()
                      }}
                      className="tap-link mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink underline decoration-rule underline-offset-4"
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="mt-1 w-full"
                loading={submitting}
                disabled={!supabaseConfigured}
              >
                {mode === 'register' ? 'Crear cuenta' : 'Entrar'}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-rule" />
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">o</span>
              <span className="h-px flex-1 bg-rule" />
            </div>

            <Button
              variant="secondary"
              size="lg"
              className="w-full justify-between"
              onClick={() => {
                void handleDemo()
              }}
              loading={demoLoading}
            >
              <span>Ver con datos de ejemplo</span>
              <ArrowRight size={16} weight="bold" />
            </Button>

          </div>
        </div>

        <footer className="flex items-center justify-between px-5 py-5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted lg:px-10 xl:px-16">
          <span>stingy · Gasta con intención</span>
          <span>v0.1.0</span>
        </footer>
      </main>
    </div>
  )
}
