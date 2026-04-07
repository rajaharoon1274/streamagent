import { createBrowserClient } from '@supabase/ssr'

// Single instance — never recreated
let client = null

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
  return client
}