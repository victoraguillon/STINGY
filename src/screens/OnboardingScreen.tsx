import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useSession } from '../app/session'
import type { Currency, Profile, RateType } from '../db/types'
import { BrandLockup } from '../components/Brand'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { Segmented } from '../components/ui/Segmented'
import { useRates } from '../hooks/useRates'
import { cn } from '../lib/cn'
import { formatRate } from '../lib/format'

const STEPS = [
  { id: 'name', kicker: 'Paso 01', title: '¿Cómo te llamas?', body: 'Es lo único que verás en la cabecera de tu recibo. Nada de apellidos si no quieres.' },
  { id: 'money', kicker: 'Paso 02', title: '¿En qué moneda piensas?', body: 'Puedes cambiarla después. Cada movimiento guarda la tasa con la que lo anotaste.' },
  { id: 'telegram', kicker: 'Paso 03', title: 'Telegram, cuando quieras.', body: 'El bot ya está disponible. En Ajustes generas un código de un solo uso y lo envías a @stingyve_bot para anotar desde el chat.' },
] as const

export function OnboardingScreen({ profile }: { profile: Profile }) {
  const { completeOnboarding } = useSession()
  const rates = useRates()
  const reduceMotion = useReducedMotion()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(profile.name)
  const [baseCurrency, setBaseCurrency] = useState<Currency>(profile.baseCurrency)
  const [rateType, setRateType] = useState<RateType>(profile.defaultRateType)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const current = STEPS[step] ?? STEPS[0]

  function next() {
    if (step === 0 && name.trim().length < 2) {
      setError('Escribe tu nombre para abrir el libro.')
      return
    }
    setError(null)
    if (step < 2) {
      setStep(step + 1)
      return
    }
    void finish()
  }

  async function finish() {
    setSaving(true)
    try {
      await completeOnboarding(name, baseCurrency, rateType)
      // El gate de App reacciona al perfil vivo; no hace falta navegar.
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 pt-5 md:px-8 md:pt-8">
        <BrandLockup coinSize={21} textClassName="text-[20px]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
          0{step + 1} / 03
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 pb-8 pt-10 md:px-8 md:pt-14">
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((entry, index) => (
            <span
              key={entry.id}
              className={cn(
                'h-[2px] flex-1 transition-colors duration-300',
                index < step ? 'bg-ink' : index === step ? 'bg-lime' : 'bg-rule',
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 max-w-[560px] md:mt-14"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              {current.kicker}
            </p>
            <h1 className="mt-2 font-display text-[34px] font-semibold leading-[0.98] tracking-[-0.045em] text-ink md:text-[42px]">
              {current.title}
            </h1>
            <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-muted">
              {current.body}
            </p>

            <div className="mt-8">
              {step === 0 && (
                <div className="max-w-[380px]">
                  <Field
                    label="Nombre"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setError(null)
                    }}
                    placeholder="Ana Torres"
                    autoComplete="name"
                    autoFocus
                  />
                </div>
              )}

              {step === 1 && (
                <div className="flex max-w-[480px] flex-col gap-6">
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                      Moneda base
                    </legend>
                    <Segmented
                      options={[
                        { value: 'VES', label: 'Bolívares' },
                        { value: 'USD', label: 'Dólares' },
                      ]}
                      value={baseCurrency}
                      onChange={setBaseCurrency}
                      label="Moneda base"
                    />
                    <p className="text-[12px] leading-relaxed text-muted">
                      {baseCurrency === 'VES'
                        ? 'El recibo mostrará el balance en bolívares y su equivalente en dólares.'
                        : 'El recibo mostrará el balance en dólares y su equivalente en bolívares.'}
                    </p>
                  </fieldset>

                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                      Tasa por defecto
                    </legend>
                    <Segmented
                      options={[
                        { value: 'bcv', label: 'BCV' },
                        { value: 'paralelo', label: 'Paralelo' },
                      ]}
                      value={rateType}
                      onChange={setRateType}
                      label="Tasa por defecto"
                    />
                    <p className="text-[12px] leading-relaxed text-muted">
                      {rateType === 'bcv'
                        ? `BCV: ${formatRate(rates.bcv.value)} Bs por dólar.`
                        : `Paralelo: ${formatRate(rates.paralelo.value)} Bs por dólar.`}{' '}
                      La tasa se congela al anotar.
                    </p>
                  </fieldset>
                </div>
              )}

              {step === 2 && (
                <div className="max-w-[520px]">
                  <div className="rounded-btn border border-rule bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-muted">
                        Así se anotará
                      </span>
                    </div>
                    <pre className="mt-3 overflow-x-auto font-mono text-[13px] leading-relaxed text-ink">
                      Mercado 12511 bolivares bcv
                    </pre>
                    <p className="mt-2 text-[12px] leading-relaxed text-muted">
                      El bot responderá con el monto en bolívares y su equivalente en dólares.
                      Sin emojis, sin ruido.
                    </p>
                  </div>
                  <p className="mt-4 max-w-[46ch] text-[12px] leading-relaxed text-muted">
                    Podrás vincular tu Telegram desde Ajustes con un código de un solo uso.
                    Mientras tanto, todo se anota desde la app.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-5 border-l-2 border-tomato-text pl-2.5 text-[12px] text-tomato-text"
              >
                {error}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-auto flex items-center justify-between gap-4 pt-12">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={14} weight="bold" />
              Atrás
            </Button>
          ) : (
            <span />
          )}
          <Button variant="primary" size="lg" onClick={next} loading={saving}>
            {step === 2 ? 'Empezar a anotar' : 'Continuar'}
            {step < 2 && <ArrowRight size={15} weight="bold" />}
          </Button>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 pb-5 font-mono text-[8px] uppercase tracking-[0.12em] text-muted md:px-8">
        <span>Una cuenta por persona</span>
        <span>{profile.demo ? 'Datos de ejemplo' : 'Tu libro'}</span>
      </footer>
    </div>
  )
}
