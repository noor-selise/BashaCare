"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NoDeskNotice, OpeningDesk, SignedOutGate } from "@/components/layout/signed-out-gate"
import { findPersonRecord } from "@/data/directory"
import { useAuth } from "@/lib/blocks/auth-context"
import { deskPathFromAuth, roleHome } from "@/lib/session/role-home"
import { useBuilding, useSessionActor } from "@/lib/store"

const HomePage = () => {
  const router = useRouter()
  const actor = useSessionActor()
  const { hydrated, signOut, people, session } = useBuilding()
  const { configured, login, claims, roles, status } = useAuth()
  const [loginPending, setLoginPending] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const deskPath = deskPathFromAuth(roles, claims?.email)
  // Spec §3.3: an IAM role alone is not a desk — the account also needs a Person row, or the
  // desk opens with a "Desk / System" placeholder and no flat/vendor link.
  const hasPersonRow = Boolean(session && findPersonRecord(session.actorId, people))

  useEffect(() => {
    if (status !== "authenticated" || !hydrated) return
    if (actor && hasPersonRow) router.replace(roleHome(actor.role))
  }, [actor, hasPersonRow, hydrated, router, status])

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

  const noDeskNotice = (
    <NoDeskNotice
      email={claims?.email}
      onSignOut={() => {
        void handleSignOut()
      }}
    />
  )

  if (status === "authenticated") {
    if (!deskPath && !session) return noDeskNotice
    if (hydrated && !hasPersonRow) return noDeskNotice
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
      pending={loginPending}
      error={loginError}
      onSignIn={() => {
        void handleBlocksLogin()
      }}
    />
  )
}

export default HomePage
