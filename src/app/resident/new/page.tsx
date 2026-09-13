"use client"

import { AppShell } from "@/components/layout/app-shell"
import { RequestComposer } from "@/components/requests/request-composer"

const NewRequestPage = () => {
  return (
    <AppShell allow={["resident"]}>
      <h1 className="font-display text-[32px] leading-tight">Report a problem</h1>
      <p className="mt-2 max-w-xl text-ink-soft">
        Write it the way you would text Hasan. Bangla is fine. A photo helps.
      </p>
      <div className="mt-6 max-w-2xl">
        <RequestComposer />
      </div>
    </AppShell>
  )
}

export default NewRequestPage
