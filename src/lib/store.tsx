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
  addVendor as addVendorRecord,
  loadBuildingRecords,
  markNoticeReadRemote,
  saveBuildingInfo,
  saveNotice,
  saveRequest,
  seedBuildingRecords
} from "@/lib/blocks/building-data"
import { saveOwnProfile, type ProfilePatch } from "@/lib/blocks/profile"
import { invitePerson as invitePersonRecord, type InviteInput } from "@/lib/blocks/registry"
import { markRequestNoticesRead, noticeDraft } from "@/lib/notices"
import { sameActorId } from "@/lib/request-highlight"
import type {
  BuildingInfo,
  Decision,
  Evidence,
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
  submitRequest: (input: { message: string; id?: string; evidence?: Evidence[] }) => Promise<string>
  acknowledge: (id: string) => void
  applyAi: (id: string, urgency: Urgency, reason?: string) => void
  assignVendor: (id: string, vendorId: string) => void
  markDone: (id: string, after?: Evidence, cost?: number) => void
  verify: (id: string) => void
  rejectVerify: (id: string) => void
  markNoticeRead: (id: string) => void
  visibleRequests: () => RequestRecord[]
  addFlat: (input: { label: string; floor: number }) => Promise<void>
  updateBuildingInfo: (input: Omit<BuildingInfo, "id">) => Promise<void>
  invitePerson: (input: InviteInput) => Promise<void>
  addVendor: (input: { name: string; trade: string }) => Promise<void>
  updateProfile: (patch: ProfilePatch) => Promise<void>
}

const BuildingContext = createContext<BuildingApi | null>(null)

const nextId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const now = () => new Date().toISOString()

// seedBuildingRecords()'s per-collection "already seeded?" check races itself when this
// provider's auth effect fires more than once for the same page load (React Strict Mode's
// double effect invocation, a remount, rapid auth-state churn) — each firing can see an empty
// collection before the other's writes land, and both then create a full set of seed rows.
// One attempt per page load is enough; a full reload resets this and tries again if it failed.
let seedAttempted = false

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

    // Person rows key on a normalised email, so normalise the claim before it becomes the actor id.
    const session = { actorId: claims.email.trim().toLowerCase(), role }
    setState((current) => ({ ...current, session }))

    const load = async () => {
      try {
        if (role === "admin" && !seedAttempted) {
          seedAttempted = true
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
      const actorKey = state.session.actorId
      if (state.session.role === "resident") {
        return state.requests.filter(
          (item) =>
            sameActorId(item.residentId, actorKey) ||
            sameActorId(item.residentId, actor.id) ||
            sameActorId(item.residentId, actor.email)
        )
      }
      if (state.session.role === "vendor") {
        return state.requests.filter(
          (item) => item.vendorId && actor.vendorId && item.vendorId === actor.vendorId
        )
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
      submitRequest: async ({ message, id: requestedId, evidence }) => {
        const draftId = requestedId ?? nextId("req")
        const createdAt = now()
        const suggestion = proposeFromMessage(message, state.requests)
        const record: RequestRecord = {
          id: draftId,
          flatId: actor?.flatId ?? "unknown",
          residentId: (state.session?.actorId ?? actor?.email ?? actor?.id ?? "unknown").trim().toLowerCase(),
          message,
          category: suggestion.category,
          urgency: suggestion.urgency,
          status: "submitted",
          createdAt,
          evidence: evidence ?? [],
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
        // Blocks assigns a UUID on create — wait for that id before routing or linking notices.
        const saved = await saveRequest(record)
        const finalRecord = saved.id === draftId ? record : saved
        const draft = noticeDraft("submitted", finalRecord)
        const notice: Notice = {
          ...draft,
          id: nextId("n"),
          at: createdAt,
          read: false
        }
        setState((current) => ({
          ...current,
          requests: [finalRecord, ...current.requests],
          notices: [notice, ...current.notices]
        }))
        void saveNotice(notice)
        return finalRecord.id
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
        const item = state.requests.find((row) => row.id === id)
        if (!item || item.status === "verified_closed" || item.status === "rejected") return

        const assigned = addEvent(
          {
            ...item,
            vendorId,
            status: "assigned",
            assignedAt: now()
          },
          "Assigned to vendor"
        )
        patchRequest(id, () => assigned)

        const draft = noticeDraft("assigned", assigned)
        const notice: Notice = {
          ...draft,
          id: nextId("n"),
          at: now(),
          read: false
        }
        setState((current) => ({
          ...current,
          notices: [notice, ...current.notices]
        }))
        void saveNotice(notice)
      },
      markDone: (id, after, cost) => {
        const item = state.requests.find((row) => row.id === id)
        if (
          !item ||
          item.status === "verified_closed" ||
          item.status === "awaiting_verification" ||
          item.status === "rejected"
        ) {
          return
        }

        const updated = addEvent(
          {
            ...item,
            status: "awaiting_verification",
            completedAt: now(),
            cost: cost !== undefined ? cost : item.cost,
            evidence: after ? [...item.evidence, after] : item.evidence
          },
          "Work marked done — waiting for resident verify"
        )
        patchRequest(id, () => updated)

        const draft = noticeDraft("ready_to_verify", updated)
        const notice: Notice = {
          ...draft,
          id: nextId("n"),
          at: now(),
          read: false
        }
        setState((current) => ({
          ...current,
          notices: [notice, ...current.notices]
        }))
        void saveNotice(notice)
      },
      verify: (id) => {
        const item = state.requests.find((row) => row.id === id)
        if (!item || item.status !== "awaiting_verification") return

        const closed = addEvent(
          {
            ...item,
            status: "verified_closed",
            verifiedAt: now()
          },
          "Resident verified — closed"
        )
        patchRequest(id, () => closed)

        const draft = noticeDraft("verified_closed", closed)
        const notice: Notice = {
          ...draft,
          id: nextId("n"),
          at: now(),
          read: false
        }
        setState((current) => {
          current.notices.forEach((row) => {
            if (row.requestId === id && !row.read) {
              void markNoticeReadRemote(row.id)
            }
          })
          return {
            ...current,
            notices: [notice, ...markRequestNoticesRead(current.notices, id)]
          }
        })
        void saveNotice(notice)
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
      addVendor: async (input) => {
        const vendor = await addVendorRecord(input)
        setState((current) => ({ ...current, vendors: [...current.vendors, vendor] }))
      },
      updateProfile: async (patch) => {
        if (!state.session?.actorId) throw new Error("Sign in to update your profile.")
        const existing = findPerson(state.session.actorId, state.people)
        const saved = await saveOwnProfile(state.session.actorId, patch, existing)
        setState((current) => ({
          ...current,
          people: current.people.some((item) => item.id.toLowerCase() === saved.id.toLowerCase())
            ? current.people.map((item) => {
                return item.id.toLowerCase() === saved.id.toLowerCase() ? saved : item
              })
            : [...current.people, saved]
        }))
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
