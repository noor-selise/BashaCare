import type { RequestStatus } from "@/types"

export const statusOrder: RequestStatus[] = [
  "submitted",
  "acknowledged",
  "assigned",
  "in_progress",
  "awaiting_verification",
  "verified_closed"
]
