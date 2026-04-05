'use client'

import { Suspense } from 'react'
import AuthPage from '@/components/auth/AuthPage'

export default function ForgotPage() {
  return (
    <Suspense fallback={null}>
      <AuthPage initialMode="forgot" />
    </Suspense>
  )
}
