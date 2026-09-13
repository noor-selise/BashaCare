"use client"

import { AppShell } from "@/components/layout/app-shell"
import { useAuth } from "@/lib/blocks/auth-context"
import { useSessionActor } from "@/lib/store"

const AccountPage = () => {
  const actor = useSessionActor()
  const { configured, claims, status } = useAuth()

  return (
    <AppShell allow={["admin", "resident", "staff", "committee", "vendor"]}>
      <h1 className="font-display text-[32px] leading-tight">Account</h1>
      <dl className="mt-6 max-w-lg space-y-3">
        <div>
          <dt className="text-ink-faint">Name</dt>
          <dd>{actor?.name}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Role</dt>
          <dd>{actor?.role}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Flat</dt>
          <dd>{actor?.flatId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Blocks</dt>
          <dd>
            {configured
              ? status === "authenticated"
                ? claims?.email ?? "Signed in"
                : "Configured — not signed in"
              : "Not configured"}
          </dd>
        </div>
      </dl>
    </AppShell>
  )
}

export default AccountPage
