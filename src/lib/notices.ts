import type { Notice, RequestRecord, Role } from "@/types"
import { roleHome } from "@/lib/session/role-home"

export type NoticeEvent = "submitted" | "assigned" | "ready_to_verify" | "verified_closed"

export const noticeDraft = (
  event: NoticeEvent,
  request: Pick<RequestRecord, "id" | "flatId" | "message">
): Omit<Notice, "id" | "read" | "at"> => {
  switch (event) {
    case "submitted":
      return {
        role: "staff",
        title: `New request · Flat ${request.flatId}`,
        body: request.message.slice(0, 120),
        requestId: request.id
      }
    case "assigned":
      return {
        role: "vendor",
        title: `New job · Flat ${request.flatId}`,
        body: request.message.slice(0, 120),
        requestId: request.id
      }
    case "ready_to_verify":
      return {
        role: "resident",
        title: `Verify work · Flat ${request.flatId}`,
        body: "Staff marked the work done. Confirm before it closes.",
        requestId: request.id
      }
    case "verified_closed":
      return {
        role: "resident",
        title: `Request closed · Flat ${request.flatId}`,
        body: "You verified the work. This request is closed.",
        requestId: request.id
      }
  }
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
