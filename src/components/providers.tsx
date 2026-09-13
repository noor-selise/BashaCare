"use client"

import { AuthProvider } from "@/lib/blocks/auth-context"
import { BuildingProvider } from "@/lib/store"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <BuildingProvider>{children}</BuildingProvider>
    </AuthProvider>
  )
}
