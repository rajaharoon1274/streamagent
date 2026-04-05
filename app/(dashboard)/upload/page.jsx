'use client'
import AppShell from '@/components/layout/AppShell'
import { useEffect } from 'react'
import { useApp } from '@/context/AppContext'

// Renders the AppShell with the upload page pre-selected
export default function UploadPage() {
  return <AppShellWithUpload />
}

function AppShellWithUpload() {
  const { set } = useApp()
  useEffect(() => { set({ page: 'upload' }) }, [])
  return <AppShell />
}
