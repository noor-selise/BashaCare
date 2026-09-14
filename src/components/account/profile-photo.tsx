"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"
import { isBlocksConfigured } from "@/lib/blocks/client"
import { storageDownloadUrl, uploadProfilePhoto } from "@/lib/blocks/evidence-storage"

const initialsFrom = (name: string) => {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

type ProfilePhotoProps = {
  email: string
  name: string
  photoFileId?: string
  size?: "sm" | "lg"
  editable?: boolean
  onUploaded?: (fileId: string, mimeType: string) => void
}

export const ProfilePhoto = ({
  email,
  name,
  photoFileId,
  size = "lg",
  editable = false,
  onUploaded
}: ProfilePhotoProps) => {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (previewUrl) return
    if (!photoFileId) {
      setImageUrl(null)
      return
    }

    let active = true
    void storageDownloadUrl(photoFileId).then((url) => {
      if (active) setImageUrl(url)
    })

    return () => {
      active = false
    }
  }, [photoFileId, previewUrl])

  const handlePick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setPreviewUrl(URL.createObjectURL(file))

    try {
      const { fileId, mimeType } = await uploadProfilePhoto(email, file)
      onUploaded?.(fileId, mimeType)
    } catch (uploadError) {
      setPreviewUrl(null)
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed.")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  const dimension = size === "sm" ? "size-9 text-[11px]" : "size-24 text-xl"
  const src = previewUrl ?? imageUrl

  return (
    <div className={cn("flex flex-col gap-2", size === "lg" ? "items-start" : "items-center")}>
      <div
        className={cn(
          "overflow-hidden rounded-full border border-hairline bg-courtyard-soft font-display text-courtyard",
          dimension,
          src ? "bg-surface" : "flex items-center justify-center"
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned Blocks storage URLs are dynamic
          <img src={src} alt={`${name} profile photo`} className="size-full object-cover" loading="lazy" />
        ) : (
          <span aria-hidden="true">{initialsFrom(name || "?")}</span>
        )}
      </div>
      {editable ? (
        <>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="Upload profile photo"
          />
          <Button type="button" variant="ghost" onClick={handlePick} disabled={uploading}>
            {uploading ? "Uploading…" : photoFileId || previewUrl ? "Change photo" : "Upload photo"}
          </Button>
          {isBlocksConfigured ? (
            <p className="text-sm text-ink-soft">Profile photo is required before you can save.</p>
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
        </>
      ) : null}
    </div>
  )
}
