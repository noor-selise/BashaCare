"use client"

import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { useBuilding } from "@/lib/store"

export const RequestComposer = () => {
  const router = useRouter()
  const { submitRequest } = useBuilding()
  const [message, setMessage] = useState("")
  const [photoLabel, setPhotoLabel] = useState("")

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!message.trim()) return
    const id = submitRequest({
      message: message.trim(),
      photoLabel: photoLabel.trim() || undefined
    })
    router.push(`/resident/requests/${id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-hairline bg-surface p-4 md:p-6">
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
      <label className="block" htmlFor="photo">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Photo caption (optional)
        </span>
        <input
          id="photo"
          value={photoLabel}
          onChange={(event) => setPhotoLabel(event.target.value)}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          placeholder="Cabin door, floor 4"
        />
      </label>
      <Button type="submit">Submit request</Button>
    </form>
  )
}
