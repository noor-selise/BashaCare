"use client"

import { MotionConfig } from "framer-motion"
import { AuthProvider } from "@/lib/blocks/auth-context"
import { BuildingProvider } from "@/lib/store"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BuildingProvider>{children}</BuildingProvider>
      </AuthProvider>
    </MotionConfig>
  )
}
