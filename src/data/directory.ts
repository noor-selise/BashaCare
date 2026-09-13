import type { Actor, Role, Vendor } from "@/types"

export const BUILDING = {
  name: "Uttara Heights",
  line: "12 storeys · 48 flats · House 18, Road 7, Uttara",
  fee: 2500
}

export const vendors: Vendor[] = [
  { id: "metro-lift", name: "Metro Lift AMC", trade: "Lift" },
  { id: "rahman-pump", name: "Rahman Pump Service", trade: "Water / pump" },
  { id: "uttara-electric", name: "Uttara Electric", trade: "Electrical" }
]

export const people: Actor[] = [
  {
    id: "noor@yopmail.com",
    name: "Noor Mohammad",
    role: "admin",
    title: "Admin"
  },
  {
    id: "nusrat@yopmail.com",
    name: "Nusrat Rahman",
    role: "resident",
    flatId: "7-B",
    title: "Flat 7-B"
  },
  {
    id: "karim@yopmail.com",
    name: "Karim Hossain",
    role: "resident",
    flatId: "10-A",
    title: "Flat 10-A"
  },
  {
    id: "hasan@yopmail.com",
    name: "Hasan Mia",
    role: "staff",
    title: "Caretaker"
  },
  {
    id: "rina@yopmail.com",
    name: "Rina Chowdhury",
    role: "committee",
    title: "Treasurer"
  },
  {
    id: "rafiq@yopmail.com",
    name: "Rafiq Uddin",
    role: "vendor",
    vendorId: "metro-lift",
    title: "Metro Lift AMC"
  },
  {
    id: "rahman@yopmail.com",
    name: "Abdur Rahman",
    role: "vendor",
    vendorId: "rahman-pump",
    title: "Rahman Pump Service"
  }
]

export const findPerson = (id: string) => {
  return (
    people.find((item) => item.id === id) ?? {
      id,
      name: "Desk",
      role: "staff" as const,
      title: "System"
    }
  )
}

export const findVendor = (id: string, list: Vendor[] = vendors) => {
  return list.find((item) => item.id === id)
}

export const personFromEmail = (email?: string | null) => {
  if (!email) return null
  return people.find((item) => item.id === email.toLowerCase()) ?? null
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
