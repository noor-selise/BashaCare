import { demoRoleFromEmail } from "@/data/directory"
import { sameActorId } from "@/lib/request-highlight"
import type { Evidence, Person, RequestRecord, RequestStatus, Role } from "@/types"

export type LifecycleActor = {
  role: Role
  actorId: string
  vendorId?: string
}

export type AssignTarget =
  | { kind: "vendor"; vendorId: string }
  | { kind: "staff"; staffAssigneeId: string }

export const canAcknowledge = (status: RequestStatus, actor: LifecycleActor) => {
  if (status !== "submitted") return false
  return actor.role === "staff" || actor.role === "admin"
}

export const canAssign = (status: RequestStatus, actor: LifecycleActor) => {
  if (actor.role !== "staff" && actor.role !== "admin") return false
  return status === "acknowledged" || status === "assigned" || status === "in_progress"
}

export const isJobAssignee = (request: RequestRecord, actor: LifecycleActor) => {
  if (request.vendorId && actor.vendorId && request.vendorId === actor.vendorId) return true
  if (request.staffAssigneeId && sameActorId(request.staffAssigneeId, actor.actorId)) return true
  return false
}

export const canAdvanceWork = (actor: LifecycleActor, request: RequestRecord) => {
  if (actor.role === "staff" || actor.role === "admin") return true
  if (actor.role === "vendor") return isJobAssignee(request, actor)
  return false
}

export const canStartWork = (
  status: RequestStatus,
  actor: LifecycleActor,
  request: RequestRecord
) => {
  return status === "assigned" && canAdvanceWork(actor, request)
}

export const canConfirmDone = (
  status: RequestStatus,
  actor: LifecycleActor,
  request: RequestRecord
) => {
  return status === "in_progress" && canAdvanceWork(actor, request)
}

export const canRejectVerify = (status: RequestStatus) => {
  return status === "awaiting_verification"
}

export const MARK_DONE_LABEL = "Work marked done — waiting for resident verify"
export const REJECT_VERIFY_LABEL = "Resident said not done — back in progress"

export const applyRejectVerify = (request: RequestRecord): RequestRecord => {
  return {
    ...request,
    status: "in_progress",
    completedAt: undefined
  }
}

export const needsNewAfterPhoto = (request: RequestRecord) => {
  let lastReject = -1
  let lastDone = -1
  request.timeline.forEach((event, index) => {
    if (event.label === REJECT_VERIFY_LABEL) lastReject = index
    if (event.label === MARK_DONE_LABEL) lastDone = index
  })
  return lastReject > lastDone
}

export const hasAfterPhoto = (request: RequestRecord, after?: Evidence) => {
  if (after) return true
  if (needsNewAfterPhoto(request)) return false
  return request.evidence.some((item) => item.kind === "after")
}

export const applyAssign = (
  request: RequestRecord,
  target: AssignTarget,
  assignedAt: string
): RequestRecord => {
  if (target.kind === "vendor") {
    return {
      ...request,
      vendorId: target.vendorId,
      staffAssigneeId: undefined,
      status: "assigned",
      assignedAt
    }
  }
  return {
    ...request,
    vendorId: undefined,
    staffAssigneeId: target.staffAssigneeId,
    status: "assigned",
    assignedAt
  }
}

export const parseAssignValue = (value: string): AssignTarget | null => {
  const separator = value.indexOf(":")
  if (separator <= 0) return null
  const kind = value.slice(0, separator)
  const rest = value.slice(separator + 1)
  if (!rest) return null
  if (kind === "vendor") return { kind: "vendor", vendorId: rest }
  if (kind === "staff") return { kind: "staff", staffAssigneeId: rest }
  return null
}

export const assignValue = (target: AssignTarget) => {
  return target.kind === "vendor" ? `vendor:${target.vendorId}` : `staff:${target.staffAssigneeId}`
}

export const inHouseStaffPeople = (people: Person[]) => {
  return people.filter((person) => {
    const demo = demoRoleFromEmail(person.email)
    if (demo === "staff") return true
    if (demo) return false
    // ponytail: invited staff have no role on Person; treat unknown people without a flat or vendor as staff
    return !person.flatId && !person.vendorId
  })
}

export const vendorContactEmail = (vendorId: string, people: Person[]) => {
  return people.find((person) => person.vendorId === vendorId)?.email
}

export const currentAssignValue = (request: RequestRecord, fallback?: AssignTarget) => {
  if (request.vendorId) return assignValue({ kind: "vendor", vendorId: request.vendorId })
  if (request.staffAssigneeId) {
    return assignValue({ kind: "staff", staffAssigneeId: request.staffAssigneeId })
  }
  return fallback ? assignValue(fallback) : ""
}
