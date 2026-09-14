import type { Flat, RequestRecord, Role } from "@/types"

export type BuildingFacts = {
  name: boolean
  address: boolean
  storeys: boolean
  registeredCount: boolean
  fee: boolean
}

export const uniqueFlatIds = (requests: RequestRecord[]): string[] => {
  const seen = new Set<string>()
  const ids: string[] = []
  for (const item of requests) {
    if (!item.flatId || seen.has(item.flatId)) continue
    seen.add(item.flatId)
    ids.push(item.flatId)
  }
  return ids
}

const matchFlat = (flats: Flat[], key: string) => {
  return flats.find((item) => item.id === key || item.label === key)
}

const synthesiseFlat = (id: string): Flat => {
  return { id, label: id, floor: 0, status: "occupied" }
}

export const visibleFlats = ({
  role,
  actorFlatId,
  flats,
  assignedFlatIds
}: {
  role: Role
  actorFlatId?: string
  flats: Flat[]
  assignedFlatIds: string[]
}): Flat[] => {
  switch (role) {
    case "resident": {
      if (!actorFlatId) return []
      const match = matchFlat(flats, actorFlatId)
      return match ? [match] : []
    }
    case "staff":
    case "committee":
    case "admin":
      return [...flats].sort((a, b) => a.label.localeCompare(b.label))
    case "vendor":
      return assignedFlatIds.map((id) => matchFlat(flats, id) ?? synthesiseFlat(id))
    default: {
      const _never: never = role
      return _never
    }
  }
}

export const buildingFactsForRole = (role: Role): BuildingFacts => {
  switch (role) {
    case "resident":
    case "vendor":
      return { name: true, address: true, storeys: false, registeredCount: false, fee: false }
    case "staff":
      return { name: true, address: true, storeys: true, registeredCount: true, fee: false }
    case "committee":
    case "admin":
      return { name: true, address: true, storeys: true, registeredCount: true, fee: true }
    default: {
      const _never: never = role
      return _never
    }
  }
}
