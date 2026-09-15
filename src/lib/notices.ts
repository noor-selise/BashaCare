import type { Notice, RequestRecord, Role } from "@/types"
import { sameActorId } from "@/lib/request-highlight"
import { roleHome } from "@/lib/session/role-home"

export type NoticeEvent = "submitted" | "assigned" | "ready_to_verify" | "not_done" | "verified_closed"

export type NoticeActor = {
  role: Role
  id: string
  email: string
}

const withEmergencyPrefix = (title: string, urgency: RequestRecord["urgency"]) => {
  return urgency === "emergency" ? `Emergency · ${title}` : title
}

export const noticeDraft = (
  event: NoticeEvent,
  request: Pick<
    RequestRecord,
    "id" | "flatId" | "message" | "urgency" | "vendorId" | "staffAssigneeId" | "residentId"
  >,
  recipientId?: string
): Omit<Notice, "id" | "read" | "at"> => {
  switch (event) {
    case "submitted":
      return {
        role: "staff",
        title: withEmergencyPrefix(`New request · Flat ${request.flatId}`, request.urgency),
        body: request.message.slice(0, 120),
        requestId: request.id
      }
    case "assigned":
      return {
        role: request.staffAssigneeId ? "staff" : "vendor",
        title: withEmergencyPrefix(`New job · Flat ${request.flatId}`, request.urgency),
        body: request.message.slice(0, 120),
        requestId: request.id,
        recipientId
      }
    case "ready_to_verify":
      return {
        role: "resident",
        title: `Verify work · Flat ${request.flatId}`,
        body: "Staff marked the work done. Confirm before it closes.",
        requestId: request.id,
        recipientId: request.residentId
      }
    case "not_done":
      return {
        role: recipientId ? "vendor" : "staff",
        title: withEmergencyPrefix(`Work not done · Flat ${request.flatId}`, request.urgency),
        body: "The resident said the work was not done. Continue the job and attach a new after photo.",
        requestId: request.id,
        recipientId
      }
    case "verified_closed":
      return {
        role: "resident",
        title: `Request closed · Flat ${request.flatId}`,
        body: "You verified the work. This request is closed.",
        requestId: request.id,
        recipientId: request.residentId
      }
    default: {
      const _never: never = event
      return _never
    }
  }
}

export const visibleNotices = (notices: Notice[], actor: NoticeActor) => {
  if (actor.role === "admin") return notices
  return notices.filter((item) => {
    if (item.role !== "all" && item.role !== actor.role) return false
    if (!item.recipientId) return true
    return sameActorId(item.recipientId, actor.email) || sameActorId(item.recipientId, actor.id)
  })
}

export const inboxLink = (
  notice: Notice,
  request: RequestRecord | undefined,
  role: Role
): { href: string; label: string } => {
  if (!request || !notice.requestId) {
    return { href: roleHome(role), label: "Home" }
  }

  const base =
    role === "resident"
      ? `/resident/requests/${request.id}`
      : role === "vendor"
        ? `/vendor/jobs/${request.id}`
        : `/staff/requests/${request.id}`

  if (role === "resident" && request.status === "awaiting_verification") {
    return { href: base, label: "Verify now" }
  }

  if (request.status === "awaiting_verification") {
    return {
      href: role === "vendor" ? base : `/staff/requests/${request.id}`,
      label: "View request"
    }
  }

  if (request.status === "verified_closed") {
    return { href: base, label: "View closed request" }
  }

  if (role === "resident") {
    return { href: base, label: "Open request" }
  }

  return { href: base, label: role === "vendor" ? "Open job" : "Open triage" }
}

export const markRequestNoticesRead = (notices: Notice[], requestId: string): Notice[] => {
  return notices.map((notice) => {
    return notice.requestId === requestId ? { ...notice, read: true } : notice
  })
}
