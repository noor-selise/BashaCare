"use client"

import { MotionConfig } from "framer-motion"
import { AuthProvider } from "@/lib/blocks/auth-context"
import { ToastProvider } from "@/components/ui/toast"
import { BuildingProvider } from "@/lib/store"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <BuildingProvider>{children}</BuildingProvider>
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  )
}
