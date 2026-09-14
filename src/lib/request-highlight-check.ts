import { isNewRequest, sameActorId } from "@/lib/request-highlight"
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

console.log("request-highlight-check ok")
