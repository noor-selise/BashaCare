import { isNewRequest, isUnackedEmergency, sameActorId } from "@/lib/request-highlight"
import type { RequestRecord } from "@/types"

if (!sameActorId("Karim@yopmail.com", "karim@yopmail.com")) {
  throw new Error("sameActorId should match case-insensitively")
}

const submitted: RequestRecord = {
  id: "x",
  flatId: "10-A",
  residentId: "karim@yopmail.com",
  message: "test",
  category: "other",
  urgency: "routine",
  status: "submitted",
  createdAt: new Date().toISOString(),
  evidence: [],
  timeline: []
}

if (!isNewRequest(submitted)) {
  throw new Error("submitted requests should count as new")
}

if (isUnackedEmergency(submitted)) {
  throw new Error("routine submitted is not an unacked emergency")
}

const emergencySubmitted: RequestRecord = { ...submitted, urgency: "emergency" }
if (!isUnackedEmergency(emergencySubmitted)) {
  throw new Error("submitted emergency must stay loud until acknowledge")
}
if (isUnackedEmergency({ ...emergencySubmitted, status: "acknowledged" })) {
  throw new Error("acknowledged emergency must drop the loud cue")
}
if (isUnackedEmergency({ ...emergencySubmitted, status: "in_progress" })) {
  throw new Error("in-progress emergency must drop the loud cue")
}

console.log("request-highlight-check ok")
