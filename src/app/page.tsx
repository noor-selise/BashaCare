"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { actors, BUILDING } from "@/data/seed"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/blocks/auth-context"
import { roleHome } from "@/lib/session/role-home"
import { useBuilding } from "@/lib/store"

const HomePage = () => {
  const router = useRouter()
  const { signIn } = useBuilding()
  const { configured, login, claims } = useAuth()
  const [loginPending, setLoginPending] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleEnter = (actorId: string) => {
    signIn(actorId)
    const actor = actors.find((item) => item.id === actorId)
    if (actor) router.push(roleHome(actor.role))
  }

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

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto grid min-h-screen max-w-[1200px] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-end px-5 py-12 md:px-12 md:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-courtyard">
            One building · one desk
          </p>
          <h1 className="mt-4 font-display text-[clamp(40px,8vw,72px)] leading-[1.05] tracking-tight">
            {BUILDING.name}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">
            Problems get a request. Emergencies look like emergencies. The committee can see who is slow and what they cost — without calling Hasan.
          </p>
          <p className="mt-8 text-sm text-ink-faint">{BUILDING.line}</p>
        </section>
        <section className="bg-warm px-5 py-12 md:px-10 md:py-20">
          <h2 className="font-display text-2xl">Enter as</h2>
          <p className="mt-2 text-ink-soft">
            Sign in with the BashaCare tenant, then pick a desk role for the scripted walkthrough.
          </p>
          {claims?.email ? (
            <p className="mt-4 text-sm text-courtyard" role="status">
              Signed in as {claims.email}
            </p>
          ) : null}
          {loginError ? (
            <p className="mt-4 border border-terracotta bg-terracotta-wash px-4 py-3 text-sm" role="alert">
              {loginError}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                void handleBlocksLogin()
              }}
              disabled={!configured || loginPending}
              aria-label="Sign in with Blocks hosted login"
            >
              {loginPending ? "Opening login…" : "Sign in with Blocks"}
            </Button>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center text-ink-soft underline-offset-4 hover:underline"
            >
              Login page
            </Link>
          </div>
          <ul className="mt-6 space-y-2">
            {actors.map((actor) => (
              <li key={actor.id}>
                <button
                  type="button"
                  onClick={() => handleEnter(actor.id)}
                  className="flex min-h-14 w-full items-center justify-between border border-hairline bg-surface px-4 text-left hover:border-courtyard"
                >
                  <span>
                    <span className="block font-medium">{actor.name}</span>
                    <span className="text-sm text-ink-faint">{actor.title}</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.08em] text-courtyard">
                    {actor.role}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-faint">
            Blocks SDK: {configured ? "configured for BashaCare" : "not configured — local demo store"}
          </p>
        </section>
      </div>
    </div>
  )
}

export default HomePage
