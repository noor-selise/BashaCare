"use client"

import { useEffect, useState, type FormEvent } from "react"
import { ProfilePhoto } from "@/components/account/profile-photo"
import { Button } from "@/components/ui/button"
import { findVendor } from "@/data/directory"
import { useAuth } from "@/lib/blocks/auth-context"
import { isBlocksConfigured } from "@/lib/blocks/client"
import { useBuilding, useSessionActor } from "@/lib/store"
import type { Role, Vendor } from "@/types"

const titlePlaceholder = (role: Role) => {
  switch (role) {
    case "resident":
      return "Flat 7-B"
    case "staff":
      return "Caretaker"
    case "committee":
      return "Treasurer"
    case "vendor":
      return "Metro Lift AMC"
    case "admin":
      return "Admin"
    default: {
      const _never: never = role
      return _never
    }
  }
}

export const ProfileForm = ({ vendors }: { vendors: Vendor[] }) => {
  const actor = useSessionActor()
  const { updateProfile } = useBuilding()
  const { claims } = useAuth()
  const [name, setName] = useState("")
  const [title, setTitle] = useState("")
  const [photoFileId, setPhotoFileId] = useState<string | undefined>()
  const [photoMimeType, setPhotoMimeType] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!actor) return
    setName(actor.name)
    setTitle(actor.title)
    setPhotoFileId(actor.photoFileId)
    setPhotoMimeType(actor.photoMimeType)
  }, [actor])

  if (!actor) return null

  const vendor = actor.vendorId ? findVendor(actor.vendorId, vendors) : undefined
  const photoRequired = isBlocksConfigured
  const hasPhoto = Boolean(photoFileId)
  const canSave = name.trim() && title.trim() && (!photoRequired || hasPhoto)

  const handlePhotoUploaded = (fileId: string, mimeType: string) => {
    setPhotoFileId(fileId)
    setPhotoMimeType(mimeType)
    setSaved(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateProfile({
        name: name.trim(),
        title: title.trim(),
        photoFileId,
        photoMimeType
      })
      setSaved(true)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-6">
      <p className="text-ink-soft">
        Update how you appear on the desk — name, title, and photo. Role and flat are set by the
        building registry.
      </p>
      <ProfilePhoto
        email={actor.email}
        name={name || actor.name}
        photoFileId={photoFileId}
        editable
        onUploaded={handlePhotoUploaded}
      />
      <label className="block" htmlFor="profile-name">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Name
        </span>
        <input
          id="profile-name"
          required
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setSaved(false)
          }}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
          autoComplete="name"
        />
      </label>
      <label className="block" htmlFor="profile-title">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Title
        </span>
        <input
          id="profile-title"
          required
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setSaved(false)
          }}
          placeholder={titlePlaceholder(actor.role)}
          className="mt-2 min-h-11 w-full border border-hairline bg-surface-2 px-3 text-[16px]"
        />
      </label>
      <dl className="grid gap-3 border border-hairline bg-surface-2 p-4">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Email</dt>
          <dd className="mt-1 font-mono text-sm">{claims?.email ?? actor.email}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Role</dt>
          <dd className="mt-1 uppercase tracking-[0.06em] text-courtyard">{actor.role}</dd>
        </div>
        {actor.flatId ? (
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Flat</dt>
            <dd className="mt-1 font-mono">{actor.flatId}</dd>
          </div>
        ) : null}
        {vendor ? (
          <div>
            <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Vendor desk</dt>
            <dd className="mt-1">{vendor.name}</dd>
          </div>
        ) : null}
      </dl>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || !canSave}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        {saved ? (
          <p role="status" className="text-sm text-garden">
            Profile saved.
          </p>
        ) : null}
        {photoRequired && !hasPhoto ? (
          <p role="status" className="text-sm text-ink-soft">
            Upload a profile photo to save.
          </p>
        ) : null}
        {error ? (
          <p role="status" className="text-sm text-emergency">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  )
}
