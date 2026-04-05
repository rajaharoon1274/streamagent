import './globals.css'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from '@/context/AppContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'StreamAgent',
  description: 'Interactive video platform for sales professionals',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#181E30',
                  color: '#EEF2FF',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '10px',
                  fontSize: '13px',
                },
              }}
            />
          </AuthProvider>
        </AppProvider>
      </body>
    </html>
  )
}