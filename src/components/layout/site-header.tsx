"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ProfilePhoto } from "@/components/account/profile-photo"
import { Button } from "@/components/ui/button"
import { roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"
import { cn } from "@/lib/cn"
import type { Role } from "@/types"

const navActive = (pathname: string, href: string) => {
  if (href === "/committee") return pathname === "/committee"
  return pathname === href || pathname.startsWith(`${href}/`)
}

const navFor = (role: Role) => {
  switch (role) {
    case "resident":
      return [
        { href: "/resident", label: "Requests" },
        { href: "/resident/new", label: "New" },
        { href: "/inbox", label: "Alerts" },
        { href: "/account", label: "Account" }
      ]
    case "staff":
      return [
        { href: "/staff", label: "Board" },
        { href: "/inbox", label: "Alerts" },
        { href: "/account", label: "Account" }
      ]
    case "admin":
      return [
        { href: "/committee", label: "Desk" },
        { href: "/committee/registry", label: "Registration" },
        { href: "/staff", label: "Board" },
        { href: "/inbox", label: "Alerts" },
        { href: "/account", label: "Account" }
      ]
    case "committee":
      return [
        { href: "/committee", label: "Desk" },
        { href: "/committee/registry", label: "Registration" },
        { href: "/staff", label: "Board" },
        { href: "/inbox", label: "Alerts" },
        { href: "/account", label: "Account" }
      ]
    case "vendor":
      return [
        { href: "/vendor", label: "Jobs" },
        { href: "/inbox", label: "Alerts" },
        { href: "/account", label: "Account" }
      ]
    default: {
      const _never: never = role
      return _never
    }
  }
}

const useCompactNav = (role: Role) => role !== "resident"

const NavLinks = ({
  items,
  pathname,
  unread,
  layout,
  onNavigate
}: {
  items: ReturnType<typeof navFor>
  pathname: string
  unread: number
  layout: "row" | "stack"
  onNavigate?: () => void
}) => {
  return (
    <>
      {items.map((item) => {
        const active = navActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative inline-flex min-h-11 shrink-0 items-center whitespace-nowrap text-[16px]",
              layout === "row" ? "px-3" : "w-full px-4",
              active ? "text-courtyard" : "text-ink-soft hover:text-ink"
            )}
          >
            {active && layout === "row" ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 bg-courtyard-soft"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : null}
            {active && layout === "stack" ? (
              <span className="absolute inset-y-0 left-0 w-1 bg-courtyard" aria-hidden="true" />
            ) : null}
            {item.label}
            {item.href === "/inbox" && unread > 0 ? (
              <span className="ml-2 font-mono text-terracotta">{unread}</span>
            ) : null}
          </Link>
        )
      })}
    </>
  )
}

const BrandMark = ({ role, buildingName }: { role: Role; buildingName: string }) => {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline gap-2 md:gap-3">
        <Link href={roleHome(role)} className="shrink-0 font-display text-xl">
          BashaCare
        </Link>
        <p className="truncate text-sm text-ink-faint">{buildingName}</p>
      </div>
    </div>
  )
}

const AccountActions = ({
  actor,
  onSignOut,
  showLabel = true
}: {
  actor: { email: string; name: string; photoFileId?: string; role: Role }
  onSignOut: () => void
  showLabel?: boolean
}) => {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href="/account"
        className="inline-flex min-h-11 items-center gap-2 rounded-full pr-2 hover:bg-surface-2"
        aria-label="Open account"
      >
        <ProfilePhoto
          email={actor.email}
          name={actor.name}
          photoFileId={actor.photoFileId}
          size="sm"
        />
        {showLabel ? (
          <span className="hidden text-sm text-ink-soft lg:inline">
            {actor.name}
            <span className="ml-2 text-[11px] uppercase tracking-[0.08em] text-courtyard">
              {actor.role}
            </span>
          </span>
        ) : null}
      </Link>
      <Button variant="ghost" onClick={onSignOut} aria-label="Sign out">
        Sign out
      </Button>
    </div>
  )
}

export const SiteHeader = () => {
  const pathname = usePathname()
  const router = useRouter()
  const actor = useSessionActor()
  const { signOut, notices, session, buildingInfo } = useBuilding()
  const [menuOpen, setMenuOpen] = useState(false)
  const unread = notices.filter((item) => {
    if (item.read) return false
    if (session?.role === "admin") return true
    return item.role === "all" || item.role === session?.role
  }).length

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [menuOpen])

  if (!actor) return null

  const items = navFor(actor.role)
  const compactNav = useCompactNav(actor.role)
  const buildingName = buildingInfo?.name ?? "Uttara Heights"

  const handleSignOut = () => {
    void (async () => {
      setMenuOpen(false)
      await signOut()
      router.replace("/")
    })()
  }

  const handleMenuToggle = () => {
    setMenuOpen((open) => !open)
  }

  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-surface/90 shadow-[var(--shadow-lg)] backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-4 py-3 md:px-8">
        {/* Desktop: one row — brand | nav | account */}
        <div className="hidden md:flex md:items-center md:gap-6">
          <BrandMark role={actor.role} buildingName={buildingName} />
          <nav aria-label="Primary" className="flex min-w-0 flex-1 items-center justify-center gap-1">
            <NavLinks items={items} pathname={pathname} unread={unread} layout="row" />
          </nav>
          <AccountActions actor={actor} onSignOut={handleSignOut} />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-3">
            <BrandMark role={actor.role} buildingName={buildingName} />

            {compactNav ? (
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/account"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface-2"
                  aria-label="Open account"
                >
                  <ProfilePhoto
                    email={actor.email}
                    name={actor.name}
                    photoFileId={actor.photoFileId}
                    size="sm"
                  />
                </Link>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] border border-hairline bg-surface text-ink"
                  aria-expanded={menuOpen}
                  aria-controls="desk-nav-drawer"
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  onClick={handleMenuToggle}
                >
                  <span aria-hidden="true" className="flex flex-col gap-1">
                    <span className="block h-0.5 w-5 bg-ink" />
                    <span className="block h-0.5 w-5 bg-ink" />
                    <span className="block h-0.5 w-5 bg-ink" />
                  </span>
                </button>
              </div>
            ) : (
              <Link
                href="/account"
                className="inline-flex min-h-11 items-center gap-2 rounded-full pr-2 hover:bg-surface-2"
                aria-label="Open account"
              >
                <ProfilePhoto
                  email={actor.email}
                  name={actor.name}
                  photoFileId={actor.photoFileId}
                  size="sm"
                />
              </Link>
            )}
          </div>

          {!compactNav ? (
            <nav aria-label="Primary" className="mt-3 flex flex-wrap items-center gap-1">
              <NavLinks items={items} pathname={pathname} unread={unread} layout="row" />
            </nav>
          ) : null}
        </div>
      </div>

      {compactNav && menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 bg-ink/20 md:hidden"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="desk-nav-drawer"
            aria-label="Primary"
            className="fixed inset-x-0 top-14 z-30 border-b border-hairline bg-surface shadow-[var(--shadow-sheet)] md:hidden"
          >
            <div className="mx-auto max-w-[1200px] py-2">
              <NavLinks
                items={items}
                pathname={pathname}
                unread={unread}
                layout="stack"
                onNavigate={() => setMenuOpen(false)}
              />
              <div className="mt-2 border-t border-hairline px-4 py-3">
                <p className="text-sm text-ink-soft">
                  {actor.name}
                  <span className="ml-2 text-[11px] uppercase tracking-[0.08em] text-courtyard">
                    {actor.role}
                  </span>
                </p>
                <Button
                  variant="ghost"
                  className="mt-2 w-full justify-start px-0"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  Sign out
                </Button>
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  )
}
