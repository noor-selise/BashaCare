"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NoDeskNotice, OpeningDesk, SignedOutGate } from "@/components/layout/signed-out-gate"
import { useAuth } from "@/lib/blocks/auth-context"
import { deskPathFromAuth, roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"

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

  if (status === "authenticated" && (deskPath || actor)) {
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

  if (status === "authenticated" && !deskPath) {
    return (
      <NoDeskNotice
        email={claims?.email}
        onSignOut={() => {
          void handleSignOut()
        }}
      />
    )
  }

  return (
    <SignedOutGate
      configured={configured}
      pending={loginPending}
      error={loginError}
      onSignIn={() => {
        void handleBlocksLogin()
      }}
    />
  )
}

export default HomePage
