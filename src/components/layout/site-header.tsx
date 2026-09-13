"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { actors } from "@/data/seed"
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
    case "committee":
      return [
        { href: "/committee", label: "Desk" },
        { href: "/inbox", label: "Alerts" }
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
  const { signIn, signOut, notices, session } = useBuilding()
  const unread = notices.filter((item) => {
    return !item.read && (item.role === "all" || item.role === session?.role)
  }).length

  if (!actor) return null

  const items = navFor(actor.role)

  const handleSignOut = () => {
    signOut()
    router.push("/")
  }

  const handleSwitch = (actorId: string) => {
    signIn(actorId)
    const next = actors.find((item) => item.id === actorId)
    if (next) router.push(roleHome(next.role))
  }

  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-baseline gap-3">
          <Link href={roleHome(actor.role)} className="font-display text-xl">
            BashaCare
          </Link>
          <p className="text-sm text-ink-faint">Uttara Heights</p>
        </div>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-h-11 items-center px-3 text-[16px]",
                pathname === item.href ? "bg-courtyard-soft text-courtyard" : "text-ink-soft hover:text-ink"
              )}
            >
              {item.label}
              {item.href === "/inbox" && unread > 0 ? (
                <span className="ml-2 font-mono text-terracotta">{unread}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="role-switch">
            Switch person
          </label>
          <select
            id="role-switch"
            className="min-h-11 border border-hairline bg-surface px-3 text-[16px]"
            value={actor.id}
            onChange={(event) => handleSwitch(event.target.value)}
          >
            {actors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.title}
              </option>
            ))}
          </select>
          <Button variant="ghost" onClick={handleSignOut}>
            Leave
          </Button>
        </div>
      </div>
    </header>
  )
}
