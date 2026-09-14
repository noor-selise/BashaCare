"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"
import { cn } from "@/lib/cn"
import type { Role } from "@/types"

const navFor = (role: Role) => {
  switch (role) {
    case "resident":
      return [
        { href: "/resident", label: "Requests" },
        { href: "/resident/new", label: "New" },
        { href: "/inbox", label: "Alerts" }
      ]
    case "staff":
      return [
        { href: "/staff", label: "Board" },
        { href: "/inbox", label: "Alerts" }
      ]
    case "admin":
    case "committee":
      return [
        { href: "/committee", label: "Desk" },
        { href: "/committee/registry", label: "Registry" },
        { href: "/staff", label: "Board" },
        { href: "/inbox", label: "Alerts" },
        { href: "/account", label: "Account" }
      ]
    case "vendor":
      return [
        { href: "/vendor", label: "Jobs" },
        { href: "/inbox", label: "Alerts" }
      ]
    default: {
      const _never: never = role
      return _never
    }
  }
}

export const SiteHeader = () => {
  const pathname = usePathname()
  const router = useRouter()
  const actor = useSessionActor()
  const { signOut, notices, session, buildingInfo } = useBuilding()
  const unread = notices.filter((item) => {
    if (item.read) return false
    if (session?.role === "admin") return true
    return item.role === "all" || item.role === session?.role
  }).length

  if (!actor) return null

  const items = navFor(actor.role)

  const handleSignOut = async () => {
    await signOut()
    router.replace("/")
  }

  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-surface/90 shadow-[var(--shadow-lg)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-baseline gap-3">
          <Link href={roleHome(actor.role)} className="font-display text-xl">
            BashaCare
          </Link>
          <p className="text-sm text-ink-faint">{buildingInfo?.name ?? "Uttara Heights"}</p>
        </div>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
          {items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex min-h-11 items-center px-3 text-[16px]",
                  active ? "text-courtyard" : "text-ink-soft hover:text-ink"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 bg-courtyard-soft"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null}
                {item.label}
                {item.href === "/inbox" && unread > 0 ? (
                  <span className="ml-2 font-mono text-terracotta">{unread}</span>
                ) : null}
              </Link>
            )
          })}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-ink-soft">
            {actor.name}
            <span className="ml-2 text-[11px] uppercase tracking-[0.08em] text-courtyard">
              {actor.role}
            </span>
          </p>
          <Button variant="ghost" onClick={() => void handleSignOut()} aria-label="Sign out">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
