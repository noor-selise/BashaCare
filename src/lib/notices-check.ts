import { inboxLink } from "@/lib/notices"
import type { Notice, RequestRecord } from "@/types"

const baseRequest: RequestRecord = {
  id: "req-test",
  flatId: "7-B",
  residentId: "resident@test",
  message: "Lift stuck",
  category: "lift",
  urgency: "urgent",
  status: "awaiting_verification",
  createdAt: new Date().toISOString(),
  evidence: [],
  timeline: []
}

const notice: Notice = {
  id: "n-test",
  role: "resident",
  title: "Verify work",
  body: "Confirm",
  requestId: "req-test",
  at: new Date().toISOString(),
  read: false
}

const verifyLink = inboxLink(notice, baseRequest, "resident")
if (verifyLink.label !== "Verify now") {
  throw new Error(`expected Verify now, got ${verifyLink.label}`)
}

const closedLink = inboxLink(notice, { ...baseRequest, status: "verified_closed" }, "staff")
if (closedLink.label !== "View closed request") {
  throw new Error(`expected View closed request, got ${closedLink.label}`)
}

console.log("notices check ok: inbox link labels match lifecycle")
