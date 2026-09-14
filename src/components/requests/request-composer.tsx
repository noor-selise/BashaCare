"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useMemo, useState, type FormEvent } from "react"
import { EvidenceUpload } from "@/components/requests/evidence-upload"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { fadeRise } from "@/lib/motion"
import { useBuilding } from "@/lib/store"
import type { Evidence } from "@/types"

const nextDraftId = () => `req-${Math.random().toString(36).slice(2, 8)}`

export const RequestComposer = () => {
  const router = useRouter()
  const { submitRequest } = useBuilding()
  const toast = useToast()
  const [message, setMessage] = useState("")
  const [draftId] = useState(nextDraftId)
  const [beforeEvidence, setBeforeEvidence] = useState<Evidence | null>(null)
  const [uploading, setUploading] = useState(false)

  const tone = useMemo<Evidence["tone"]>(() => {
    const lower = message.toLowerCase()
    if (lower.includes("lift")) return "lift"
    if (lower.includes("pani") || lower.includes("water")) return "water"
    if (lower.includes("pump")) return "pump"
    return "other"
  }, [message])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!message.trim() || uploading) return
    void (async () => {
      try {
        const id = await submitRequest({
          id: draftId,
          message: message.trim(),
          evidence: beforeEvidence ? [beforeEvidence] : undefined
        })
        toast.success("Request submitted.")
        router.push(`/resident/requests/${id}`)
      } catch {
        toast.error("Could not submit the request. Try again.")
      }
    })()
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial="hidden"
      animate="visible"
      variants={fadeRise}
      className="space-y-4 border border-hairline bg-surface p-4 md:p-6"
    >
      <label className="block" htmlFor="message">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          What is happening
        </span>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-2 w-full border border-hairline bg-surface-2 p-3 font-bengali text-[16px] leading-relaxed"
          placeholder="লিখুন যেভাবে বলতেন — lift, pani, emergency…"
        />
      </label>
      <EvidenceUpload
        requestId={draftId}
        kind="before"
        tone={tone}
        onUploaded={setBeforeEvidence}
        onUploadingChange={setUploading}
      />
      <Button type="submit" disabled={uploading}>
        {uploading ? "Uploading photo…" : "Submit request"}
      </Button>
    </motion.form>
  )
}
