import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Profile, Tx, TxKind } from '../db/types'
import { QuickAddSheet } from '../components/QuickAddSheet'

interface QuickAddOptions {
  kind?: TxKind
  tx?: Tx
}

interface QuickAddContextValue {
  open: (options?: QuickAddOptions) => void
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null)

interface Session {
  id: number
  open: boolean
  kind: TxKind
  tx: Tx | null
}

export function QuickAddProvider({
  profile,
  children,
}: {
  profile: Profile
  children: ReactNode
}) {
  const [session, setSession] = useState<Session>({
    id: 0,
    open: false,
    kind: 'expense',
    tx: null,
  })

  const open = useCallback((options?: QuickAddOptions) => {
    setSession((current) => ({
      id: current.id + 1,
      open: true,
      kind: options?.tx?.kind ?? options?.kind ?? 'expense',
      tx: options?.tx ?? null,
    }))
  }, [])

  const onOpenChange = useCallback((nextOpen: boolean) => {
    setSession((current) => ({ ...current, open: nextOpen }))
  }, [])

  const value = useMemo(() => ({ open }), [open])

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddSheet
        key={session.id}
        open={session.open}
        onOpenChange={onOpenChange}
        profile={profile}
        initialKind={session.kind}
        editTx={session.tx}
      />
    </QuickAddContext.Provider>
  )
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext)
  if (!context) throw new Error('useQuickAdd debe usarse dentro de QuickAddProvider')
  return context
}
