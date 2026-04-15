import type { ReactNode } from 'react'
import { SectorsProvider } from '@/features/sectors/context/SectorsContext'
import { StaffAuthProvider } from '@/features/staff/context/StaffAuthContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StaffAuthProvider>
      <SectorsProvider>{children}</SectorsProvider>
    </StaffAuthProvider>
  )
}
