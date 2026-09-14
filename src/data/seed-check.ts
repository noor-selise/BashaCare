import { proposeFromMessage } from "../features/ai/propose"
import { PUMP_TOTAL, seedBuildingInfo, seedCast, seedFlats, seedPeople, seedRequests } from "./seed"

const pumpJobs = seedRequests.filter((item) => item.equipmentId === "roof-pump")
const total = pumpJobs.reduce((sum, item) => sum + (item.cost ?? 0), 0)

if (pumpJobs.length !== 6) {
  throw new Error(`expected 6 pump jobs, got ${pumpJobs.length}`)
}

if (total !== 38500 || PUMP_TOTAL !== 38500) {
  throw new Error(`expected ৳38,500 pump spend, got ${total}`)
}

const openEmergency = seedRequests.filter((item) => {
  return item.urgency === "emergency" && item.status === "submitted"
})

if (openEmergency.length < 1) {
  throw new Error("expected an open emergency for the demo")
}

if (seedCast.length !== 8) {
  throw new Error(`expected 8 seed cast members, got ${seedCast.length}`)
}

if (seedPeople.length !== seedCast.length) {
  throw new Error("seedPeople must mirror seedCast 1:1")
}

if (seedPeople.some((person) => "role" in person)) {
  throw new Error("seedPeople rows must not carry a role field — role comes from IAM")
}

if (seedFlats.length !== 2 || !seedFlats.some((f) => f.label === "7-B") || !seedFlats.some((f) => f.label === "10-A")) {
  throw new Error("expected seed flats 7-B and 10-A")
}

if (seedBuildingInfo.name !== "Uttara Heights" || seedBuildingInfo.flatCount !== 48) {
  throw new Error("seed building info drifted from the BRD assumptions")
}

const urgentProposal = proposeFromMessage("lift jam again, urgent fix needed", [])
if (urgentProposal.urgency !== "urgent") {
  throw new Error(`expected urgent when resident says urgent, got ${urgentProposal.urgency}`)
}

const dripProposal = proposeFromMessage("bathroom tap dripping slowly", [])
if (dripProposal.urgency === "emergency") {
  throw new Error("slow drip should not auto-classify as emergency")
}

console.log("seed check ok: 6 pump jobs, ৳38,500, open emergency present, AI urgency sane")
