'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const { set: setApp } = useApp()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  // Fetch profile + workspace for a user
  async function fetchUserData(userId) {
    const [profileRes, workspaceRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('workspaces').select('*').eq('owner_id', userId).single(),
    ])
    if (profileRes.data) {
      const p = profileRes.data
      setProfile(p)
      // Sync real profile into AppContext so every component (Dashboard, Sidebar, Settings)
      // shows the correct user name and email without any extra fetches.
      setApp({
        account: {
          firstName:  p.first_name  || '',
          lastName:   p.last_name   || '',
          email:      p.email       || '',
          company:    p.company     || '',
          phone:      p.phone       || '',
          timezone:   p.timezone    || 'America/Los_Angeles',
          avatarUrl:  p.avatar_url  || '',
          twoFA:      p.two_fa_enabled || false,
        },
      })
    }
    if (workspaceRes.data) setWorkspace(workspaceRes.data)
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchUserData(session.user.id)
      }
      setLoading(false)
    })

    // Subscribe to auth state changes
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
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setWorkspace(null)
    router.push('/login')
  }, [router, supabase])

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
