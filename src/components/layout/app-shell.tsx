"use client"

import { AnimatePresence, motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"
import { EmergencyBanner } from "@/components/layout/emergency-banner"
import { SiteHeader } from "@/components/layout/site-header"
import { pageTransition } from "@/lib/motion"
import { roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"
import type { Role } from "@/types"

export const AppShell = ({
  children,
  allow
}: {
  children: ReactNode
  allow: Role[]
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const actor = useSessionActor()
  const { session, hydrated } = useBuilding()

  useEffect(() => {
    if (!hydrated) return
    if (!session) {
      router.replace("/")
      return
    }
    if (actor && actor.role !== "admin" && !allow.includes(actor.role)) {
      router.replace(roleHome(actor.role))
    }
  }, [actor, allow, hydrated, router, session])

  const allowed = Boolean(actor && (actor.role === "admin" || allow.includes(actor.role)))

  if (!hydrated || !allowed) {
    return (
      <div className="px-4 py-16 text-center text-ink-soft">Opening the desk…</div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <EmergencyBanner />
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={pageTransition.initial}
            animate={pageTransition.animate}
            exit={pageTransition.exit}
            transition={pageTransition.transition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
