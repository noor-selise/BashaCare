"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/blocks/auth-context"
import { BUILDING } from "@/data/seed"

const LoginPage = () => {
  const { configured, login } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    setPending(true)
    try {
      await login("/")
    } catch (caught) {
      setPending(false)
      setError(caught instanceof Error ? caught.message : "Could not start hosted login.")
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-courtyard">
          One building · one desk
        </p>
        <h1 className="mt-4 font-display text-[clamp(36px,6vw,56px)] leading-tight">
          Sign in to {BUILDING.name}
        </h1>
        <p className="mt-4 text-ink-soft">
          Hosted Blocks login. After you activate the invite, this button sends you to IAM and back to the desk.
        </p>
        {!configured ? (
          <p className="mt-6 border border-hairline bg-warm px-4 py-3 text-sm text-ink-soft" role="status">
            Hosted login is not configured. Register{" "}
            <span className="font-mono">/login/callback</span> for this origin on the BashaCare OIDC client.
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 border border-terracotta bg-terracotta-wash px-4 py-3 text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={() => {
              void handleLogin()
            }}
            disabled={!configured || pending}
            aria-label="Sign in with Blocks hosted login"
          >
            {pending ? "Opening login…" : "Sign in with Blocks"}
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-ink-soft underline-offset-4 hover:underline"
          >
            Use the demo desk
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
