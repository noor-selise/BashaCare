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
  actors,
  seedDecisions,
  seedNotices,
  seedRequests
} from "@/data/seed"
import type {
  Decision,
  Notice,
  RequestRecord,
  Session,
  Urgency
} from "@/types"

type BuildingState = {
  session: Session | null
  requests: RequestRecord[]
  decisions: Decision[]
  notices: Notice[]
}

type BuildingApi = BuildingState & {
  hydrated: boolean
  signIn: (actorId: string) => void
  signOut: () => void
  submitRequest: (input: { message: string; photoLabel?: string }) => string
  acknowledge: (id: string) => void
  applyAi: (id: string, urgency: Urgency, reason?: string) => void
  assignVendor: (id: string, vendorId: string) => void
  markDone: (id: string, afterLabel: string, cost?: number) => void
  verify: (id: string) => void
  rejectVerify: (id: string) => void
  markNoticeRead: (id: string) => void
  visibleRequests: () => RequestRecord[]
}

const BuildingContext = createContext<BuildingApi | null>(null)

const nextId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

const now = () => new Date().toISOString()

const SESSION_KEY = "bashacare.session"
const STATE_KEY = "bashacare.state"

const readStoredState = (): BuildingState | null => {
  try {
    const raw = sessionStorage.getItem(STATE_KEY)
    if (raw) return JSON.parse(raw) as BuildingState
    const sessionRaw = sessionStorage.getItem(SESSION_KEY)
    if (sessionRaw) {
      return {
        session: JSON.parse(sessionRaw) as Session,
        requests: seedRequests,
        decisions: seedDecisions,
        notices: seedNotices
      }
    }
  } catch {
    // sessionStorage can be blocked in some embedded browsers
  }
  return null
}

export const BuildingProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<BuildingState>({
    session: null,
    requests: seedRequests,
    decisions: seedDecisions,
    notices: seedNotices
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredState()
    if (stored) setState(stored)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state))
      if (state.session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state.session))
      } else {
        sessionStorage.removeItem(SESSION_KEY)
      }
    } catch {
      // keep in-memory session if storage is blocked
    }
  }, [hydrated, state])

  const api = useMemo<BuildingApi>(() => {
    const actor = actors.find((item) => item.id === state.session?.actorId)

    const patchRequest = (
      id: string,
      update: (item: RequestRecord) => RequestRecord
    ) => {
      setState((current) => ({
        ...current,
        requests: current.requests.map((item) => {
          return item.id === id ? update(item) : item
        })
      }))
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
      if (!actor) return []
      if (actor.role === "resident") {
        return state.requests.filter((item) => item.residentId === actor.id)
      }
      if (actor.role === "vendor") {
        return state.requests.filter((item) => item.vendorId === actor.vendorId)
      }
      return state.requests
    }

    return {
      ...state,
      hydrated,
      signIn: (actorId) => {
        const next = actors.find((item) => item.id === actorId)
        if (!next) return
        const session = { actorId: next.id, role: next.role }
        setState((current) => ({
          ...current,
          session
        }))
      },
      signOut: () => {
        setState((current) => ({ ...current, session: null }))
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
        setState((current) => ({
          ...current,
          requests: [record, ...current.requests],
          notices: [
            {
              id: nextId("n"),
              role: "staff",
              title: `New request from ${record.flatId}`,
              body: message.slice(0, 120),
              requestId: id,
              at: createdAt,
              read: false
            },
            ...current.notices
          ]
        }))
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
                actorId: state.session?.actorId ?? "hasan"
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
      },
      visibleRequests
    }
  }, [hydrated, state])

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
  const { session } = useBuilding()
  return actors.find((item) => item.id === session?.actorId) ?? null
}

