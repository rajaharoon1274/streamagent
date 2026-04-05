import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Double-check: middleware handles most cases, but this catches edge cases
  if (!session) redirect('/login')

  return <>{children}</>
}
