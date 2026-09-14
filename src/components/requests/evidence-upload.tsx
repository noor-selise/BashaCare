"use client"

import { useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { uploadEvidenceFile } from "@/lib/blocks/evidence-storage"
import type { Evidence } from "@/types"

type EvidenceUploadProps = {
  requestId: string
  kind: Evidence["kind"]
  tone: Evidence["tone"]
  buttonLabel?: string
  onUploaded: (evidence: Evidence) => void
  onUploadingChange?: (uploading: boolean) => void
}

export const EvidenceUpload = ({
  requestId,
  kind,
  tone,
  buttonLabel = kind === "before" ? "Add before photo" : "Add after photo",
  onUploaded,
  onUploadingChange
}: EvidenceUploadProps) => {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handlePick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    onUploadingChange?.(true)

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    try {
      const { fileId, mimeType } = await uploadEvidenceFile(file, requestId, kind)
      onUploaded({
        id: crypto.randomUUID().slice(0, 8),
        kind,
        label: kind === "before" ? "Before" : "After",
        caption: caption.trim() || file.name,
        tone,
        fileId,
        mimeType
      })
      setDone(true)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed.")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      onUploadingChange?.(false)
      event.target.value = ""
    }
  }

  return (
    <div className="grid gap-2 border border-hairline bg-surface p-4">
      <label className="block" htmlFor={`${inputId}-caption`}>
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Photo caption (optional)
        </span>
        <input
          id={`${inputId}-caption`}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          disabled={uploading || done}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          placeholder={kind === "before" ? "Cabin door, floor 4" : "Work complete"}
        />
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-label={buttonLabel}
      />
      {!done ? (
        <Button type="button" variant="ghost" onClick={handlePick} disabled={uploading}>
          {uploading ? "Uploading…" : buttonLabel}
        </Button>
      ) : (
        <p className="text-sm text-ink-soft">Photo attached.</p>
      )}
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview before upload completes
        <img
          src={previewUrl}
          alt={caption.trim() || "Uploaded preview"}
          className="aspect-[4/3] w-full max-w-sm border border-hairline object-cover"
          loading="lazy"
        />
      ) : null}
      {uploading ? (
        <p role="status" className="text-sm text-ink-soft">
          Uploading photo…
        </p>
      ) : null}
      {error ? (
        <p role="status" className="text-sm text-emergency">
          {error}
        </p>
      ) : null}
    </div>
  )
}
