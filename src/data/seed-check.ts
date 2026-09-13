import { PUMP_TOTAL, seedRequests } from "./seed"

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

console.log("seed check ok: 6 pump jobs, ৳38,500, open emergency present")
