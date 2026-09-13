"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BUILDING } from "@/data/directory"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/blocks/auth-context"
import { deskPathFromAuth, roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"

const OpeningDesk = () => {
  return (
    <div className="min-h-screen bg-canvas px-4 py-16 text-center text-ink-soft">
      Opening the desk…
    </div>
  )
}

const HomePage = () => {
  const router = useRouter()
  const actor = useSessionActor()
  const { hydrated, signOut } = useBuilding()
  const { configured, login, claims, roles, status } = useAuth()
  const [loginPending, setLoginPending] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const deskPath = deskPathFromAuth(roles, claims?.email)

  useEffect(() => {
    if (status !== "authenticated" || !hydrated) return
    if (actor) router.replace(roleHome(actor.role))
  }, [actor, hydrated, router, status])

  const handleBlocksLogin = async () => {
    setLoginError(null)
    setLoginPending(true)
    try {
      await login("/")
    } catch (caught) {
      setLoginPending(false)
      setLoginError(caught instanceof Error ? caught.message : "Could not start hosted login.")
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace("/")
  }

  if (status === "loading" || (status === "authenticated" && (deskPath || actor) && !hydrated)) {
    return <OpeningDesk />
  }

  if (status === "authenticated" && actor) {
    return <OpeningDesk />
  }

  if (status === "authenticated" && !deskPath) {
    return (
      <div className="min-h-screen bg-canvas px-5 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-3xl">No desk for this account</h1>
          <p className="mt-4 text-ink-soft">
            {claims?.email} is signed in but has no BashaCare desk role.
          </p>
          <Button className="mt-8" variant="ghost" onClick={() => void handleSignOut()}>
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-end px-5 py-12 md:px-12 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-courtyard">
            One building · one desk
          </p>
          <h1 className="mt-4 font-display text-[clamp(40px,6vw,72px)] leading-[1.05] tracking-tight">
            {BUILDING.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            Problems get a request. Emergencies look like emergencies. The committee can see who is slow and what they cost — without calling Hasan.
          </p>
          <p className="mt-8 text-sm text-ink-faint">{BUILDING.line}</p>
        </section>
        <section className="bg-warm px-5 py-12 md:px-10 md:py-20">
          <h2 className="font-display text-2xl">Sign in</h2>
          <p className="mt-2 text-ink-soft">
            Use your BashaCare account. The desk opens from the role on that account.
          </p>
          {loginError ? (
            <p className="mt-4 border border-terracotta bg-terracotta-wash px-4 py-3 text-sm" role="alert">
              {loginError}
            </p>
          ) : null}
          <div className="mt-6">
            <Button
              onClick={() => {
                void handleBlocksLogin()
              }}
              disabled={!configured || loginPending}
              aria-label="Sign in with Blocks hosted login"
            >
              {loginPending ? "Opening login…" : "Sign in with Blocks"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage
