import React from 'react'
import { ThemeProvider } from 'next-themes'

interface AppThemeProviderProps {
  children: React.ReactNode
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={['light', 'dark', 'system']}
    >
      {children}
    </ThemeProvider>
  )
}