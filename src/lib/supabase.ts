import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const supabaseConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) && anonKey.length > 20

// Placeholder values keep the client importable during a misconfigured build.
// The UI blocks auth until `supabaseConfigured` is true.
export const supabase = createClient(
  supabaseConfigured ? url : 'https://placeholder.supabase.co',
  supabaseConfigured ? anonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
)

export function isSupabaseConfigured() {
  return supabaseConfigured
}
