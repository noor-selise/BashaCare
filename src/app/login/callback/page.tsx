"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { completeLogin } from "@/lib/blocks/auth"
import { useAuth } from "@/lib/blocks/auth-context"
import { deskPathFromAuth } from "@/lib/session/role-home"

const CallbackPage = () => {
  const router = useRouter()
  const { refresh } = useAuth()
  const started = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const handleCallback = async () => {
      const result = await completeLogin(window.location.href)
      if (!result.ok) {
        setError(result.message)
        return
      }

      const session = await refresh()
      router.replace(deskPathFromAuth(session.roles, session.claims?.email) ?? "/")
    }

    void handleCallback()
  }, [refresh, router])

  if (error) {
    return (
      <div className="min-h-screen bg-canvas px-5 py-16">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-3xl">Login did not finish</h1>
          <p className="mt-4 border border-terracotta bg-terracotta-wash px-4 py-3" role="alert">
            {error}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-11 items-center text-courtyard underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas px-5 py-16 text-center text-ink-soft">
      Completing sign-in…
    </div>
  )
}

export default CallbackPage
