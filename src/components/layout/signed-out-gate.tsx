"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { FALLBACK_BUILDING } from "@/data/directory"
import { fadeRise } from "@/lib/motion"
import { formatTaka } from "@/lib/money"

type SignedOutGateProps = {
  configured: boolean
  pending: boolean
  error: string | null
  onSignIn: () => void
}

const notices = [
  {
    label: "Request",
    tone: "request" as const,
    body: "A leak in 7-B is a request, not a WhatsApp thread."
  },
  {
    label: "Emergency",
    tone: "emergency" as const,
    body: "Water in the lift shaft is pinned and terracotta — one glance, not a badge."
  },
  {
    label: "Spend",
    tone: "spend" as const,
    body: (
      <>
        The committee sees who is slow and what they cost —{" "}
        <span className="font-mono">{formatTaka(38500)}</span> on the pump last quarter — without calling Hasan.
      </>
    )
  }
]

const noticeTone = {
  request: "border-l-courtyard bg-surface",
  emergency: "border-l-terracotta bg-terracotta-wash",
  spend: "border-l-clay bg-surface"
} as const

const noticeLabel = {
  request: "text-courtyard",
  emergency: "text-terracotta-deep",
  spend: "text-ink-soft"
} as const

export const GateFrame = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="h-1 bg-courtyard" aria-hidden="true" />
      <header className="border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-4 md:flex-row md:items-baseline md:justify-between md:px-8">
          <div className="flex items-baseline gap-3">
            <p className="font-display text-xl">BashaCare</p>
            <p className="text-sm text-ink-faint">{FALLBACK_BUILDING.name}</p>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-courtyard">
            One building · one desk
          </p>
        </div>
      </header>
      {children}
    </div>
  )
}

export const OpeningDesk = () => {
  return (
    <GateFrame>
      <p className="px-4 py-16 text-center text-ink-soft md:px-8" role="status">
        Opening the desk…
      </p>
    </GateFrame>
  )
}

export const NoDeskNotice = ({
  email,
  onSignOut
}: {
  email?: string
  onSignOut: () => void
}) => {
  const handleSignOut = () => {
    onSignOut()
  }

  return (
    <GateFrame>
      <main className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
        <div className="max-w-xl rounded-[12px] border border-hairline bg-surface p-6 md:p-8">
          <h1 className="font-display text-[32px] leading-[1.15]">No desk for this account</h1>
          <p className="mt-4 text-ink-soft">
            {email} is signed in but has no BashaCare desk role.
          </p>
          <Button className="mt-8" variant="ghost" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </main>
    </GateFrame>
  )
}

export const SignedOutGate = ({
  configured,
  pending,
  error,
  onSignIn
}: SignedOutGateProps) => {
  const handleSignIn = () => {
    onSignIn()
  }

  return (
    <GateFrame>
      <main className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-8 px-4 py-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] md:gap-12 md:px-8 md:py-16">
        <motion.header
          className="md:col-start-1 md:row-start-1"
          initial="hidden"
          animate="visible"
          variants={fadeRise}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-courtyard">
            House 18 · Road 7 · Uttara
          </p>
          <h1 className="mt-3 font-display text-[clamp(40px,6vw,72px)] leading-[1.05] tracking-tight">
            {FALLBACK_BUILDING.name}
          </h1>
          <p className="mt-5 max-w-[65ch] text-lg leading-[1.35] text-ink-soft">
            Problems get a request. Emergencies look like emergencies.
          </p>
        </motion.header>

        <motion.aside
          className="overflow-hidden rounded-[12px] border border-hairline bg-surface md:sticky md:top-8 md:col-start-2 md:row-span-2 md:row-start-1"
          initial="hidden"
          animate="visible"
          variants={fadeRise}
          aria-labelledby="desk-pass-title"
        >
          <div className="h-1 bg-courtyard" aria-hidden="true" />
          <div className="p-6 md:p-8">
            <h2 id="desk-pass-title" className="font-display text-[22px] leading-[1.25]">
              The desk
            </h2>
            <p className="mt-2 text-ink-soft">
              Use the account the committee gave you. Residents, staff, committee, and vendors each open their own desk.
            </p>
            {!configured ? (
              <p className="mt-5 border border-hairline bg-warm px-4 py-3 text-sm text-ink-soft" role="status">
                Hosted login is not configured for this origin. Register{" "}
                <span className="font-mono">/login/callback</span> on the BashaCare OIDC client.
              </p>
            ) : null}
            {error ? (
              <p className="mt-5 border border-terracotta bg-terracotta-wash px-4 py-3 text-sm text-terracotta-deep" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              className="mt-6 w-full"
              onClick={handleSignIn}
              disabled={!configured || pending}
              aria-label="Sign in to the desk"
            >
              {pending ? "Opening login…" : "Enter the desk"}
            </Button>
            <p className="mt-4 text-[13px] leading-[1.4] tracking-[0.02em] text-ink-faint">
              Hosted sign-in. Your role opens the matching desk.
            </p>
          </div>
        </motion.aside>

        <section className="md:col-start-1 md:row-start-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            On this desk
          </h2>
          <ul className="mt-3 overflow-hidden border border-hairline">
            {notices.map((notice, index) => (
              <li
                key={notice.label}
                className={`border-l-4 px-4 py-4 ${noticeTone[notice.tone]} ${index > 0 ? "border-t border-t-hairline" : ""}`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${noticeLabel[notice.tone]}`}>
                  {notice.label}
                </p>
                <p className="mt-2 text-ink">{notice.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13px] leading-[1.4] tracking-[0.02em] text-ink-faint">{FALLBACK_BUILDING.line}</p>
        </section>
      </main>
    </GateFrame>
  )
}
