"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/blocks/auth-context"
import { BUILDING } from "@/data/directory"
import { deskPathFromAuth } from "@/lib/session/role-home"

const LoginPage = () => {
  const router = useRouter()
  const { configured, login, status, roles, claims } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const deskPath = deskPathFromAuth(roles, claims?.email)

  useEffect(() => {
    if (status === "authenticated" && deskPath) router.replace(deskPath)
  }, [deskPath, router, status])

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

  if (status === "loading" || (status === "authenticated" && deskPath)) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-16 text-center text-ink-soft">
        Opening the desk…
      </div>
    )
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
          Hosted Blocks login. After you sign in, the desk for your role opens.
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
        <div className="mt-8">
          <Button
            onClick={() => {
              void handleLogin()
            }}
            disabled={!configured || pending}
            aria-label="Sign in with Blocks hosted login"
          >
            {pending ? "Opening login…" : "Sign in with Blocks"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
