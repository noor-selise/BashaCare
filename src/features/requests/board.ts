import type { RequestRecord } from "@/types"

export const groupOpenBoard = (requests: RequestRecord[]) => {
  const open = requests.filter((item) => {
    return item.status !== "verified_closed" && item.status !== "rejected"
  })

  return {
    emergencies: open.filter((item) => item.urgency === "emergency"),
    urgent: open.filter((item) => item.urgency === "urgent"),
    routine: open.filter((item) => item.urgency === "routine")
  }
}
