import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/providers/query-provider'
import { AuthSessionProvider } from '@/providers/AuthSessionProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Norn — Norn Agent Observe',
  description: 'Observability for AI agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthSessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
