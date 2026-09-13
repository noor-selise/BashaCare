import type { RequestRecord, Vendor } from "@/types"

export const openUrgents = (requests: RequestRecord[]) => {
  return requests.filter((item) => {
    return (
      (item.urgency === "emergency" || item.urgency === "urgent") &&
      item.status !== "verified_closed"
    )
  })
}

export const vendorSpend = (requests: RequestRecord[], vendors: Vendor[]) => {
  return vendors
    .map((vendor) => {
      const jobs = requests.filter((item) => item.vendorId === vendor.id && item.cost != null)
      const total = jobs.reduce((sum, item) => sum + (item.cost ?? 0), 0)
      const repeats = jobs.filter((item) => item.equipmentId === "roof-pump").length
      return { vendor, total, count: jobs.length, repeats }
    })
    .sort((a, b) => b.total - a.total)
}
