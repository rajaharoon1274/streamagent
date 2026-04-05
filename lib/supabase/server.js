import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Standard server client — uses anon key + user session from httpOnly cookie
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

// Admin client — uses service role key, bypasses RLS
// ONLY use in server-side API routes (route.js files)
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  )
}
