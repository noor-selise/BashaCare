"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react"
import { proposeFromMessage } from "@/features/ai/propose"
import {
  deskRoleFromSlugs,
  demoRoleFromEmail,
  findPerson,
  vendors as directoryVendors
} from "@/data/directory"
import { useAuth } from "@/lib/blocks/auth-context"
import {
  addFlat as addFlatRecord,
  loadBuildingRecords,
  markNoticeReadRemote,
  saveBuildingInfo,
  saveNotice,
  saveRequest,
  seedBuildingRecords
} from "@/lib/blocks/building-data"
import { invitePerson as invitePersonRecord, type InviteInput } from "@/lib/blocks/registry"
import type {
  BuildingInfo,
  Decision,
  Flat,
  Notice,
  Person,
  RequestRecord,
  Session,
  Urgency,
  Vendor
} from "@/types"

type BuildingState = {
  session: Session | null
  requests: RequestRecord[]
  decisions: Decision[]
  notices: Notice[]
  vendors: Vendor[]
  flats: Flat[]
  people: Person[]
  buildingInfo: BuildingInfo | null
}

type BuildingApi = BuildingState & {
  hydrated: boolean
  signOut: () => Promise<void>
  submitRequest: (input: { message: string; photoLabel?: string }) => string
  acknowledge: (id: string) => void
  applyAi: (id: string, urgency: Urgency, reason?: string) => void
  assignVendor: (id: string, vendorId: string) => void
  markDone: (id: string, afterLabel: string, cost?: number) => void
  verify: (id: string) => void
  rejectVerify: (id: string) => void
  markNoticeRead: (id: string) => void
  visibleRequests: () => RequestRecord[]
  addFlat: (input: { label: string; floor: number }) => Promise<void>
  updateBuildingInfo: (input: Omit<BuildingInfo, "id">) => Promise<void>
  invitePerson: (input: InviteInput) => Promise<void>
}

const BuildingContext = createContext<BuildingApi | null>(null)

const nextId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const now = () => new Date().toISOString()

export const BuildingProvider = ({ children }: { children: ReactNode }) => {
  const { status, claims, roles, logout } = useAuth()
  const [state, setState] = useState<BuildingState>({
    session: null,
    requests: [],
    decisions: [],
    notices: [],
    vendors: directoryVendors,
    flats: [],
    people: [],
    buildingInfo: null
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status !== "authenticated" || !claims?.email) {
      setState((current) => ({
        ...current,
        session: null,
        requests: [],
        decisions: [],
        notices: []
      }))
      setHydrated(true)
      return
    }

    const role = deskRoleFromSlugs(roles) ?? demoRoleFromEmail(claims.email)
    if (!role) {
      setState((current) => ({ ...current, session: null }))
      setHydrated(true)
      return
    }

    const session = { actorId: claims.email, role }
    setState((current) => ({ ...current, session }))

    const load = async () => {
      try {
        if (role === "admin") {
          await seedBuildingRecords()
        }
        const records = await loadBuildingRecords()
        setState((current) => ({
          ...current,
          session,
          ...records
        }))
      } catch {
        setState((current) => ({ ...current, session }))
      } finally {
        setHydrated(true)
      }
    }

    void load()
  }, [claims, roles, status])

  const api = useMemo<BuildingApi>(() => {
    const actor = state.session ? findPerson(state.session.actorId, state.people) : null

    const persist = (item: RequestRecord) => {
      void saveRequest(item).then((saved) => {
        if (saved.id === item.id) return
        setState((current) => ({
          ...current,
          requests: current.requests.map((row) => {
            return row.id === item.id ? saved : row
          })
        }))
      })
    }

    const patchRequest = (
      id: string,
      update: (item: RequestRecord) => RequestRecord
    ) => {
      setState((current) => {
        const requests = current.requests.map((item) => {
          if (item.id !== id) return item
          const next = update(item)
          persist(next)
          return next
        })
        return { ...current, requests }
      })
    }

    const addEvent = (item: RequestRecord, label: string, detail?: string) => {
      return {
        ...item,
        timeline: [
          ...item.timeline,
          {
            id: nextId("ev"),
            at: now(),
            actorId: state.session?.actorId ?? "system",
            label,
            detail
          }
        ]
      }
    }

    const visibleRequests = () => {
      if (!actor || !state.session) return []
      if (state.session.role === "resident") {
        return state.requests.filter((item) => item.residentId === actor.id)
      }
      if (state.session.role === "vendor") {
        return state.requests.filter((item) => item.vendorId === actor.vendorId)
      }
      return state.requests
    }

    return {
      ...state,
      hydrated,
      signOut: async () => {
        await logout()
        setState((current) => ({
          ...current,
          session: null,
          requests: [],
          decisions: [],
          notices: []
        }))
      },
      submitRequest: ({ message, photoLabel }) => {
        const id = nextId("req")
        const createdAt = now()
        const suggestion = proposeFromMessage(message, state.requests)
        const record: RequestRecord = {
          id,
          flatId: actor?.flatId ?? "unknown",
          residentId: actor?.id ?? "unknown",
          message,
          category: suggestion.category,
          urgency: suggestion.urgency,
          status: "submitted",
          createdAt,
          evidence: photoLabel
            ? [
                {
                  id: nextId("evd"),
                  kind: "before",
                  label: "Before",
                  caption: photoLabel,
                  tone: suggestion.category === "lift" ? "lift" : "other"
                }
              ]
            : [],
          timeline: [
            {
              id: nextId("ev"),
              at: createdAt,
              actorId: actor?.id ?? "unknown",
              label: "Request submitted"
            }
          ],
          ai: suggestion
        }
        const notice: Notice = {
          id: nextId("n"),
          role: "staff",
          title: `New request from ${record.flatId}`,
          body: message.slice(0, 120),
          requestId: id,
          at: createdAt,
          read: false
        }
        setState((current) => ({
          ...current,
          requests: [record, ...current.requests],
          notices: [notice, ...current.notices]
        }))
        persist(record)
        void saveNotice(notice)
        return id
      },
      acknowledge: (id) => {
        patchRequest(id, (item) => {
          return addEvent(
            {
              ...item,
              status: "acknowledged",
              acknowledgedAt: now()
            },
            "Acknowledged"
          )
        })
      },
      applyAi: (id, urgency, reason) => {
        patchRequest(id, (item) => {
          const from = item.ai?.urgency ?? item.urgency
          const override = from === urgency
            ? item.staffOverride
            : {
                from,
                to: urgency,
                reason: reason ?? "Staff judgement",
                actorId: state.session?.actorId ?? "hasan@yopmail.com"
              }
          return addEvent(
            {
              ...item,
              urgency,
              category: item.ai?.category ?? item.category,
              staffReply: item.ai?.draftReply,
              staffOverride: override
            },
            from === urgency ? "AI suggestion confirmed" : "AI urgency overridden",
            reason
          )
        })
      },
      assignVendor: (id, vendorId) => {
        patchRequest(id, (item) => {
          return addEvent(
            {
              ...item,
              vendorId,
              status: "assigned",
              assignedAt: now()
            },
            "Assigned to vendor"
          )
        })
      },
      markDone: (id, afterLabel, cost) => {
        patchRequest(id, (item) => {
          return addEvent(
            {
              ...item,
              status: "awaiting_verification",
              completedAt: now(),
              cost: cost ?? item.cost,
              evidence: [
                ...item.evidence,
                {
                  id: nextId("evd"),
                  kind: "after",
                  label: "After",
                  caption: afterLabel,
                  tone: item.category === "lift" ? "lift" : "other"
                }
              ]
            },
            "Work marked done — waiting for resident verify"
          )
        })
      },
      verify: (id) => {
        patchRequest(id, (item) => {
          if (item.status !== "awaiting_verification") return item
          return addEvent(
            {
              ...item,
              status: "verified_closed",
              verifiedAt: now()
            },
            "Resident verified — closed"
          )
        })
      },
      rejectVerify: (id) => {
        patchRequest(id, (item) => {
          return addEvent(
            {
              ...item,
              status: "in_progress"
            },
            "Resident rejected close — back in progress"
          )
        })
      },
      markNoticeRead: (id) => {
        setState((current) => ({
          ...current,
          notices: current.notices.map((item) => {
            return item.id === id ? { ...item, read: true } : item
          })
        }))
        void markNoticeReadRemote(id)
      },
      addFlat: async (input) => {
        const flat = await addFlatRecord(input)
        setState((current) => ({ ...current, flats: [...current.flats, flat] }))
      },
      updateBuildingInfo: async (input) => {
        const saved = await saveBuildingInfo(input, state.buildingInfo?.id)
        setState((current) => ({ ...current, buildingInfo: saved }))
      },
      invitePerson: async (input) => {
        const person = await invitePersonRecord(input)
        setState((current) => ({ ...current, people: [...current.people, person] }))
      },
      visibleRequests
    }
  }, [hydrated, logout, state])

  return (
    <BuildingContext.Provider value={api}>
      {children}
    </BuildingContext.Provider>
  )
}

export const useBuilding = () => {
  const value = useContext(BuildingContext)
  if (!value) throw new Error("useBuilding must be used inside BuildingProvider")
  return value
}

export const useSessionActor = () => {
  const { session, people } = useBuilding()
  if (!session) return null
  const person = findPerson(session.actorId, people)
  return { ...person, role: session.role }
}
