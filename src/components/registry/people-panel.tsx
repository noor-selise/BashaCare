"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { listAccessStatus } from "@/lib/blocks/registry"
import type { Flat, Person, Role, Vendor } from "@/types"

const INVITABLE_ROLES: Exclude<Role, "admin">[] = ["resident", "staff", "committee", "vendor"]

export const PeoplePanel = ({
  people,
  flats,
  vendors,
  onInvite
}: {
  people: Person[]
  flats: Flat[]
  vendors: Vendor[]
  onInvite: (input: {
    name: string
    email: string
    role: Exclude<Role, "admin">
    flatId?: string
    vendorId?: string
  }) => Promise<void>
}) => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Exclude<Role, "admin">>("resident")
  const [flatId, setFlatId] = useState("")
  const [vendorId, setVendorId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, "pending" | "active" | "unknown">>({})

  useEffect(() => {
    let cancelled = false
    void listAccessStatus(people.map((person) => person.email)).then((result) => {
      if (!cancelled) setStatus(result)
    })
    return () => {
      cancelled = true
    }
  }, [people])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onInvite({
        name: name.trim(),
        email: email.trim(),
        role,
        flatId: role === "resident" ? flatId || undefined : undefined,
        vendorId: role === "vendor" ? vendorId || undefined : undefined
      })
      setName("")
      setEmail("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not invite this person.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">People</h2>
      <ul className="mt-4 space-y-2">
        {people.map((person) => (
          <li key={person.id} className="flex items-center justify-between border border-hairline bg-surface-2 px-3 py-2 text-sm">
            <span>
              {person.name} <span className="text-ink-faint">— {person.title}</span>
            </span>
            <span className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">
              {status[person.email] ?? "…"}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <label className="block" htmlFor="person-name">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Name</span>
            <input
              id="person-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 min-h-11 w-48 border border-hairline bg-surface-2 px-3 text-[16px]"
            />
          </label>
          <label className="block" htmlFor="person-email">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Email</span>
            <input
              id="person-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-11 w-56 border border-hairline bg-surface-2 px-3 text-[16px]"
            />
          </label>
          <label className="block" htmlFor="person-role">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Role</span>
            <select
              id="person-role"
              value={role}
              onChange={(event) => setRole(event.target.value as Exclude<Role, "admin">)}
              className="mt-2 block min-h-11 border border-hairline bg-surface px-3 text-[16px]"
            >
              {INVITABLE_ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          {role === "resident" ? (
            <label className="block" htmlFor="person-flat">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Flat</span>
              <select
                id="person-flat"
                value={flatId}
                onChange={(event) => setFlatId(event.target.value)}
                className="mt-2 block min-h-11 border border-hairline bg-surface px-3 text-[16px]"
              >
                <option value="">Select a flat</option>
                {flats.map((flat) => (
                  <option key={flat.id} value={flat.id}>
                    {flat.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {role === "vendor" ? (
            <label className="block" htmlFor="person-vendor">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Vendor</span>
              <select
                id="person-vendor"
                value={vendorId}
                onChange={(event) => setVendorId(event.target.value)}
                className="mt-2 block min-h-11 border border-hairline bg-surface px-3 text-[16px]"
              >
                <option value="">Select a vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        {error ? (
          <p
            className="border border-terracotta bg-terracotta-wash px-4 py-3 text-sm text-terracotta-deep"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Inviting…" : "Invite person"}
        </Button>
      </form>
    </section>
  )
}
