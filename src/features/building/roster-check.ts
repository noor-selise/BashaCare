import { seedFlats } from "@/data/seed"
import { buildingFactsForRole, uniqueFlatIds, visibleFlats } from "@/features/building/roster"
import type { RequestRecord } from "@/types"

const extraFlat = { id: "12-C", label: "12-C", floor: 12, status: "vacant" as const }
const roster = [...seedFlats, extraFlat]
const liftJob = {
  id: "req-7b",
  flatId: "7-B",
  residentId: "nusrat@yopmail.com",
  message: "lift",
  category: "lift",
  urgency: "emergency",
  status: "submitted",
  createdAt: "2026-09-13T08:12:00.000Z",
  evidence: [],
  timeline: []
} satisfies RequestRecord
const pumpJob = { ...liftJob, id: "pump-1", flatId: "common", residentId: "hasan@yopmail.com" }

if (uniqueFlatIds([liftJob, liftJob, pumpJob]).join(",") !== "7-B,common") {
  throw new Error("uniqueFlatIds must keep first-seen order and drop duplicates")
}

const nusrat = visibleFlats({
  role: "resident",
  actorFlatId: "7-B",
  flats: roster,
  assignedFlatIds: []
})
if (nusrat.length !== 1 || nusrat[0]?.label !== "7-B") {
  throw new Error("resident must see only their assigned flat")
}

const unassigned = visibleFlats({
  role: "resident",
  flats: roster,
  assignedFlatIds: ["12-C"]
})
if (unassigned.length !== 0) {
  throw new Error("resident without flatId must see no flats, even if assignedFlatIds is populated")
}

const staff = visibleFlats({
  role: "staff",
  actorFlatId: "7-B",
  flats: roster,
  assignedFlatIds: []
})
if (staff.map((item) => item.label).join(",") !== "10-A,12-C,7-B") {
  throw new Error(`staff must see every flat sorted by label, got ${staff.map((item) => item.label).join(",")}`)
}

for (const role of ["committee", "admin"] as const) {
  const rows = visibleFlats({ role, flats: roster, assignedFlatIds: [] })
  if (rows.length !== 3) {
    throw new Error(`${role} must see every registered flat`)
  }
}

const vendorJobs = visibleFlats({
  role: "vendor",
  flats: seedFlats,
  assignedFlatIds: uniqueFlatIds([liftJob, pumpJob])
})
if (vendorJobs.length !== 2 || vendorJobs[0]?.label !== "7-B" || vendorJobs[1]?.label !== "common") {
  throw new Error("vendor must see job flats and synthesise missing labels")
}
if (vendorJobs[1]?.floor !== 0 || vendorJobs[1]?.status !== "occupied") {
  throw new Error("synthesised common flat must be floor 0 occupied")
}

const idleVendor = visibleFlats({ role: "vendor", flats: roster, assignedFlatIds: [] })
if (idleVendor.length !== 0) {
  throw new Error("vendor with no jobs must see no flats")
}

if (buildingFactsForRole("resident").fee || buildingFactsForRole("vendor").fee) {
  throw new Error("resident and vendor must not see fee")
}
if (buildingFactsForRole("staff").fee || !buildingFactsForRole("staff").storeys) {
  throw new Error("staff must see storeys and not fee")
}
if (!buildingFactsForRole("committee").fee || !buildingFactsForRole("admin").fee) {
  throw new Error("committee and admin must see fee")
}
if (buildingFactsForRole("resident").storeys || buildingFactsForRole("resident").registeredCount) {
  throw new Error("resident must not see storeys or registered count")
}

console.log("roster check ok: role-scoped flats and building facts")
