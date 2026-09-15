"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { canConfirmAi } from "@/features/ai/override"
import { categoryLabel, formatWhen, urgencyLabel } from "@/lib/format"
import { fadeRise } from "@/lib/motion"
import { useBuilding } from "@/lib/store"
import type { RequestRecord, Urgency } from "@/types"

const AI_CONFIRM_LABEL = "AI suggestion confirmed"
const AI_OVERRIDE_LABEL = "AI urgency overridden"

const isAiReviewed = (request: RequestRecord) =>
  request.timeline.some(
    (event) => event.label === AI_CONFIRM_LABEL || event.label === AI_OVERRIDE_LABEL
  )

const isRequestClosed = (request: RequestRecord) =>
  request.status === "verified_closed" || request.status === "rejected"

export const AiPanel = ({ request }: { request: RequestRecord }) => {
  const { applyAi } = useBuilding()
  const toast = useToast()
  const [urgency, setUrgency] = useState<Urgency>(request.ai?.urgency ?? request.urgency)
  const [reason, setReason] = useState("")

  if (!request.ai) return null

  const readOnly = isRequestClosed(request) || isAiReviewed(request)
  const reviewEvent = request.timeline.find(
    (event) => event.label === AI_CONFIRM_LABEL || event.label === AI_OVERRIDE_LABEL
  )

  const proposed = request.ai.urgency
  const canSubmit = canConfirmAi(proposed, urgency, reason)

  const handleConfirm = () => {
    if (readOnly || !canSubmit) return
    const overridden = urgency !== proposed
    applyAi(request.id, urgency, overridden ? reason.trim() : undefined)
    toast.success(overridden ? "AI urgency overridden." : "AI suggestion confirmed.")
  }

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeRise}
      className="border border-hairline bg-surface-2 p-4"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        {readOnly ? "AI suggestion — on record" : "AI suggestion — staff must confirm"}
      </p>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <div>
          <dt className="text-ink-faint">Category</dt>
          <dd>{categoryLabel(request.ai.category)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">{readOnly ? "Applied urgency" : "Proposed urgency"}</dt>
          <dd>{urgencyLabel(readOnly ? request.urgency : request.ai.urgency)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-ink-soft">{request.ai.reason}</p>
      <p className="mt-3 border-l-2 border-courtyard pl-3 font-bengali text-ink">
        {request.ai.draftReply}
      </p>
      {request.ai.replaceRecommendation ? (
        <p className="mt-3 bg-warning-wash px-3 py-2 text-sm">{request.ai.replaceRecommendation}</p>
      ) : null}
      {readOnly ? (
        <div className="mt-4 space-y-2 text-sm text-ink-soft">
          {reviewEvent ? (
            <p>
              {reviewEvent.label === AI_OVERRIDE_LABEL ? "Staff override" : "Staff confirmed"} ·{" "}
              {formatWhen(reviewEvent.at)}
            </p>
          ) : null}
          {request.staffOverride ? (
            <p>
              {urgencyLabel(request.staffOverride.from)} → {urgencyLabel(request.staffOverride.to)}.{" "}
              {request.staffOverride.reason}
            </p>
          ) : null}
          {isRequestClosed(request) ? (
            <p className="border border-hairline bg-surface px-3 py-2">
              Request is closed — triage actions are read-only.
            </p>
          ) : null}
        </div>
      ) : (
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
                required
                aria-required="true"
                className="mt-1 block min-h-11 w-full border border-hairline bg-surface px-3 text-[16px]"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          ) : null}
          <Button
            onClick={handleConfirm}
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
          >
            {urgency === request.ai.urgency ? "Confirm AI" : "Override AI"}
          </Button>
          {urgency !== request.ai.urgency && !canSubmit ? (
            <p role="status" className="text-sm text-ink-soft">
              Type a reason to override.
            </p>
          ) : null}
        </div>
      )}
    </motion.section>
  )
}
