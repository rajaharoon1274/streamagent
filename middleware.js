import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // This call refreshes the session if expired — MUST happen before route checks
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Protected routes — require authentication
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/library') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/builder') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/integrations') ||
    pathname.startsWith('/pixels') ||
    pathname.startsWith('/upload')

  // Auth routes — redirect to dashboard if already logged in
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/forgot') ||
    pathname.startsWith('/reset-password')

  // Not logged in → trying to access protected page → redirect to login
  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in → trying to access auth page → redirect to dashboard
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

// Only run middleware on page routes, not static files or API routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
