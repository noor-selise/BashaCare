"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { categoryLabel, urgencyLabel } from "@/lib/format"
import { fadeRise } from "@/lib/motion"
import { useBuilding } from "@/lib/store"
import type { RequestRecord, Urgency } from "@/types"

export const AiPanel = ({ request }: { request: RequestRecord }) => {
  const { applyAi } = useBuilding()
  const [urgency, setUrgency] = useState<Urgency>(request.ai?.urgency ?? request.urgency)
  const [reason, setReason] = useState("Intermittent jam is urgent. Shaft leak is the emergency.")

  if (!request.ai) return null

  const handleConfirm = () => {
    applyAi(request.id, urgency, urgency === request.ai?.urgency ? undefined : reason)
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeRise}
      className="border border-hairline bg-surface-2 p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        AI suggestion — staff must confirm
      </p>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ink-faint">Category</dt>
          <dd>{categoryLabel(request.ai.category)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Proposed urgency</dt>
          <dd>{urgencyLabel(request.ai.urgency)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-ink-soft">{request.ai.reason}</p>
      <p className="mt-3 border-l-2 border-courtyard pl-3 font-bengali text-ink">
        {request.ai.draftReply}
      </p>
      {request.ai.replaceRecommendation ? (
        <p className="mt-3 bg-warning-wash px-3 py-2 text-sm">{request.ai.replaceRecommendation}</p>
      ) : null}
      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm" htmlFor={`urgency-${request.id}`}>
          Apply urgency
          <select
            id={`urgency-${request.id}`}
            className="mt-1 block min-h-11 w-full border border-hairline bg-surface px-3 text-[16px]"
            value={urgency}
            onChange={(event) => setUrgency(event.target.value as Urgency)}
          >
            <option value="emergency">Emergency</option>
            <option value="urgent">Urgent</option>
            <option value="routine">Routine</option>
          </select>
        </label>
        {urgency !== request.ai.urgency ? (
          <label className="text-sm" htmlFor={`reason-${request.id}`}>
            Why override
            <input
              id={`reason-${request.id}`}
              className="mt-1 block min-h-11 w-full border border-hairline bg-surface px-3 text-[16px]"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        ) : null}
        <Button onClick={handleConfirm}>
          {urgency === request.ai.urgency ? "Confirm AI" : "Override AI"}
        </Button>
        {request.staffOverride ? (
          <p className="text-sm text-ink-soft">
            Override on file: {urgencyLabel(request.staffOverride.from)} → {urgencyLabel(request.staffOverride.to)}. {request.staffOverride.reason}
          </p>
        ) : null}
      </div>
    </motion.section>
  )
}
