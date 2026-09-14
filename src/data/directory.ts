import type { Person, Role, Vendor } from "@/types"
import { seedCast } from "@/data/seed"

export const FALLBACK_BUILDING = {
  name: "BashaCare",
  line: "Sign in to see your building"
}

export const vendors: Vendor[] = [
  { id: "metro-lift", name: "Metro Lift AMC", trade: "Lift" },
  { id: "rahman-pump", name: "Rahman Pump Service", trade: "Water / pump" },
  { id: "uttara-electric", name: "Uttara Electric", trade: "Electrical" }
]

// Person ids are emails, and IAM can hand back a different casing than the row was stored
// with, so every lookup here matches case-insensitively.
export const findPersonRecord = (id: string, people: Person[]): Person | null => {
  const key = id.trim().toLowerCase()
  if (!key) return null
  return (
    people.find((item) => item.id.toLowerCase() === key || item.email.toLowerCase() === key) ?? null
  )
}

export const findPerson = (id: string, people: Person[]): Person => {
  return (
    findPersonRecord(id, people) ?? {
      id,
      email: id,
      name: "Desk",
      title: "System"
    }
  )
}

export const findVendor = (id: string, list: Vendor[] = vendors) => {
  return list.find((item) => item.id === id)
}

export const personFromEmail = (email: string | undefined | null, people: Person[]): Person | null => {
  if (!email) return null
  return people.find((item) => item.email.toLowerCase() === email.toLowerCase()) ?? null
}

export const demoRoleFromEmail = (email?: string | null): Role | null => {
  if (!email) return null
  const match = seedCast.find((item) => item.email.toLowerCase() === email.toLowerCase())
  return match?.role ?? null
}

export const roleSlugsFromUnknown = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string")
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((entry) => {
      return Array.isArray(entry) ? entry.filter((item): item is string => typeof item === "string") : []
    })
  }
  return []
}

export const deskRoleFromSlugs = (slugs: string[]): Role | null => {
  if (slugs.includes("admin")) return "admin"
  if (slugs.includes("committee")) return "committee"
  if (slugs.includes("staff")) return "staff"
  if (slugs.includes("vendor")) return "vendor"
  if (slugs.includes("resident")) return "resident"
  return null
}
