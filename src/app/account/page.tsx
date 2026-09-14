"use client"

import { AppShell } from "@/components/layout/app-shell"
import { ProfileForm } from "@/components/account/profile-form"
import { useBuilding } from "@/lib/store"

const AccountPage = () => {
  const { vendors } = useBuilding()

  return (
    <AppShell allow={["admin", "resident", "staff", "committee", "vendor"]}>
      <h1 className="font-display text-[32px] leading-tight">Account</h1>
      <ProfileForm vendors={vendors} />
    </AppShell>
  )
}

export default AccountPage
