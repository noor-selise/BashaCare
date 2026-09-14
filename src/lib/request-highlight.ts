import type { Notice, RequestRecord } from "@/types"

export const sameActorId = (left: string, right: string) => {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

/** Unacknowledged incoming work — staff/resident should spot it at a glance. */
export const isNewRequest = (request: RequestRecord) => {
  return request.status === "submitted"
}

export const isUnreadNotice = (notice: Notice) => {
  return !notice.read
}
