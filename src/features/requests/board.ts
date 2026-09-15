import { isUnackedEmergency } from "@/lib/request-highlight"
import type { RequestRecord } from "@/types"

export const groupOpenBoard = (requests: RequestRecord[]) => {
  const open = requests.filter((item) => {
    return item.status !== "verified_closed" && item.status !== "rejected"
  })

  const emergencies = open
    .filter((item) => item.urgency === "emergency")
    .sort((left, right) => Number(isUnackedEmergency(right)) - Number(isUnackedEmergency(left)))

  return {
    emergencies,
    urgent: open.filter((item) => item.urgency === "urgent"),
    routine: open.filter((item) => item.urgency === "routine")
  }
}
