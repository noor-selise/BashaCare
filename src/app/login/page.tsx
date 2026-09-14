"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { OpeningDesk, SignedOutGate } from "@/components/layout/signed-out-gate"
import { useAuth } from "@/lib/blocks/auth-context"
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

  if (status === "authenticated" && deskPath) {
    return <OpeningDesk />
  }

  if (status === "loading") {
    return (
      <SignedOutGate
        configured={configured}
        pending
        error={null}
        onSignIn={() => undefined}
      />
    )
  }

  return (
    <SignedOutGate
      configured={configured}
      pending={pending}
      error={error}
      onSignIn={() => {
        void handleLogin()
      }}
    />
  )
}

export default LoginPage
