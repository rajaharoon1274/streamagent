'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

const AuthContext = createContext(null)
const supabase = createClient()

export function AuthProvider({ children }) {
  const { set: setApp } = useApp()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function fetchUserData(userId) {
    const [profileRes, workspaceRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('workspaces').select('*').eq('owner_id', userId).single(),
    ])
    if (profileRes.data) {
      const p = profileRes.data
      setProfile(p)
      // Sync real profile into AppContext — this is the single source of truth
      setApp({
        account: {
          firstName: p.first_name || '',
          lastName: p.last_name || '',
          email: p.email || '',
          company: p.company || '',
          phone: p.phone || '',
          timezone: p.timezone || 'UTC',
          avatarUrl: p.avatar_url || '',
          avatar_url: p.avatar_url || '',   // keep both keys in sync
          twoFA: p.two_fa || false,
        },
      })
    }
    if (workspaceRes.data) setWorkspace(workspaceRes.data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        // ← Wait for profile BEFORE revealing the UI — no more flash of stale data
        fetchUserData(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setProfile(null)
          setWorkspace(null)
          return
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session.user)
          await fetchUserData(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setWorkspace(null)
    router.push('/login')
  }, [router])

  // Block the entire app from rendering until the session + profile are resolved.
  // This is what eliminates the "Justin D." flash — the UI never renders with stale data.
  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--bg, #0B0F1A)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <polygon points="5,3 19,12 5,21" fill="#4F6EF7" opacity="0.9" />
          </svg>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid rgba(79,110,247,0.2)',
            borderTop: '2px solid #4F6EF7',
            animation: 'auth-spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes auth-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, profile, workspace, loading, logout, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}