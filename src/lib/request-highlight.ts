import type { Notice, RequestRecord } from "@/types"

export const sameActorId = (left: string, right: string) => {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

/** Unacknowledged incoming work — staff/resident should spot it at a glance. */
export const isNewRequest = (request: RequestRecord) => {
  return request.status === "submitted"
}

/** Loud emergency cue (banner, pulse) — off at Acknowledge. Board terracotta stays. */
export const isUnackedEmergency = (request: RequestRecord) => {
  return request.urgency === "emergency" && request.status === "submitted"
}

export const isOpenEmergency = (request: RequestRecord) => {
  return (
    request.urgency === "emergency" &&
    request.status !== "verified_closed" &&
    request.status !== "rejected"
  )
}

export const isUnreadNotice = (notice: Notice) => {
  return !notice.read
}
