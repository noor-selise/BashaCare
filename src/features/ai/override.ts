import type { Urgency } from "@/types"

export const isAiOverride = (from: Urgency, to: Urgency) => from !== to

export const canConfirmAi = (from: Urgency, to: Urgency, reason?: string) => {
  return !isAiOverride(from, to) || Boolean(reason?.trim())
}
