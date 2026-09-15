import { inboxLink, noticeDraft, visibleNotices } from "@/lib/notices"
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

const submitted = noticeDraft("submitted", { ...baseRequest, urgency: "emergency" })
if (submitted.title !== "Emergency · New request · Flat 7-B" || submitted.role !== "staff" || submitted.recipientId) {
  throw new Error("emergency submitted notice should prefix title and fan out to staff")
}

const assignedVendor = noticeDraft(
  "assigned",
  { ...baseRequest, vendorId: "metro-lift", staffAssigneeId: undefined },
  "rafiq@yopmail.com"
)
if (
  assignedVendor.role !== "vendor" ||
  assignedVendor.recipientId !== "rafiq@yopmail.com" ||
  assignedVendor.title !== "New job · Flat 7-B"
) {
  throw new Error("assigned vendor notice must target that vendor")
}

const assignedStaff = noticeDraft(
  "assigned",
  { ...baseRequest, urgency: "emergency", staffAssigneeId: "hasan@yopmail.com", vendorId: undefined },
  "hasan@yopmail.com"
)
if (
  assignedStaff.role !== "staff" ||
  assignedStaff.recipientId !== "hasan@yopmail.com" ||
  assignedStaff.title !== "Emergency · New job · Flat 7-B"
) {
  throw new Error("assigned staff notice must target that staffer with emergency prefix")
}

const verifyDraft = noticeDraft("ready_to_verify", baseRequest)
if (verifyDraft.recipientId !== "resident@test" || verifyDraft.role !== "resident") {
  throw new Error("verify notice must target the resident")
}

const notDoneStaff = noticeDraft("not_done", { ...baseRequest, urgency: "emergency" })
if (
  notDoneStaff.role !== "staff" ||
  notDoneStaff.recipientId ||
  notDoneStaff.title !== "Emergency · Work not done · Flat 7-B"
) {
  throw new Error("not-done notice must alert all staff with emergency prefix")
}

const notDoneVendor = noticeDraft("not_done", { ...baseRequest, vendorId: "metro-lift" }, "rafiq@yopmail.com")
if (notDoneVendor.role !== "vendor" || notDoneVendor.recipientId !== "rafiq@yopmail.com") {
  throw new Error("not-done vendor notice must target that vendor")
}

const continueLink = inboxLink(notice, { ...baseRequest, status: "in_progress" }, "vendor")
if (continueLink.label !== "Open job") {
  throw new Error("after not done, vendor inbox should open the job")
}

const rafiq = { role: "vendor" as const, id: "rafiq@yopmail.com", email: "rafiq@yopmail.com" }
const amin = { role: "vendor" as const, id: "amin@yopmail.com", email: "amin@yopmail.com" }
const hasan = { role: "staff" as const, id: "hasan@yopmail.com", email: "hasan@yopmail.com" }
const admin = { role: "admin" as const, id: "noor@yopmail.com", email: "noor@yopmail.com" }

const notices: Notice[] = [
  {
    id: "n-vendor",
    role: "vendor",
    title: "job",
    body: "b",
    requestId: "req-test",
    recipientId: "rafiq@yopmail.com",
    at: "t",
    read: false
  },
  {
    id: "n-staff-all",
    role: "staff",
    title: "new",
    body: "b",
    requestId: "req-test",
    at: "t",
    read: false
  }
]

if (visibleNotices(notices, rafiq).map((item) => item.id).join() !== "n-vendor") {
  throw new Error("assignee vendor sees own job notice only")
}
if (visibleNotices(notices, amin).length !== 0) {
  throw new Error("other vendor must not see targeted job notice")
}
if (visibleNotices(notices, hasan).map((item) => item.id).join() !== "n-staff-all") {
  throw new Error("staff sees untargeted staff notices")
}
if (visibleNotices(notices, admin).length !== 2) {
  throw new Error("admin sees every notice")
}

console.log("notices check ok: inbox link labels match lifecycle")
