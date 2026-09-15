import {
  applyAssign,
  applyRejectVerify,
  assignValue,
  canAcknowledge,
  canAdvanceWork,
  canAssign,
  canConfirmDone,
  canRejectVerify,
  canStartWork,
  currentAssignValue,
  hasAfterPhoto,
  inHouseStaffPeople,
  isJobAssignee,
  MARK_DONE_LABEL,
  needsNewAfterPhoto,
  parseAssignValue,
  REJECT_VERIFY_LABEL,
  vendorContactEmail
} from "./lifecycle"
import type { LifecycleActor } from "./lifecycle"
import type { Person, RequestRecord } from "@/types"

const request = (partial: Partial<RequestRecord> = {}): RequestRecord => ({
  id: "req-1",
  flatId: "7-B",
  residentId: "nusrat@yopmail.com",
  message: "Lift stuck",
  category: "lift",
  urgency: "urgent",
  status: "submitted",
  createdAt: "2026-09-15T00:00:00.000Z",
  evidence: [],
  timeline: [],
  ...partial
})

const staff: LifecycleActor = { role: "staff", actorId: "hasan@yopmail.com" }
const admin: LifecycleActor = { role: "admin", actorId: "noor@yopmail.com" }
const metroVendor: LifecycleActor = {
  role: "vendor",
  actorId: "rafiq@yopmail.com",
  vendorId: "metro-lift"
}
const otherVendor: LifecycleActor = {
  role: "vendor",
  actorId: "amin@yopmail.com",
  vendorId: "uttara-electric"
}
const resident: LifecycleActor = { role: "resident", actorId: "nusrat@yopmail.com" }

if (canAcknowledge("submitted", staff) !== true) throw new Error("staff can acknowledge submitted")
if (canAcknowledge("acknowledged", staff)) throw new Error("cannot acknowledge twice")
if (canAcknowledge("submitted", resident)) throw new Error("resident cannot acknowledge")
if (canAcknowledge("submitted", admin) !== true) throw new Error("admin can acknowledge")

if (canAssign("submitted", staff)) throw new Error("cannot assign before acknowledge")
if (canAssign("acknowledged", staff) !== true) throw new Error("can assign after acknowledge")
if (canAssign("assigned", staff) !== true) throw new Error("can reassign while assigned")
if (canAssign("in_progress", admin) !== true) throw new Error("can reassign in progress")
if (canAssign("acknowledged", metroVendor)) throw new Error("vendor cannot assign")
if (canAssign("awaiting_verification", staff)) throw new Error("cannot assign while awaiting verify")

const assignedVendor = request({ status: "assigned", vendorId: "metro-lift" })
const assignedStaff = request({
  status: "assigned",
  staffAssigneeId: "hasan@yopmail.com"
})

if (!isJobAssignee(assignedVendor, metroVendor)) throw new Error("metro vendor is assignee")
if (isJobAssignee(assignedVendor, otherVendor)) throw new Error("other vendor is not assignee")
if (!isJobAssignee(assignedStaff, staff)) throw new Error("hasan is staff assignee")

if (!canAdvanceWork(staff, assignedVendor)) throw new Error("any staff can advance a vendor job")
if (!canAdvanceWork(admin, assignedVendor)) throw new Error("admin can advance")
if (!canAdvanceWork(metroVendor, assignedVendor)) throw new Error("assignee vendor can advance")
if (canAdvanceWork(otherVendor, assignedVendor)) throw new Error("other vendor cannot advance")
if (canAdvanceWork(resident, assignedVendor)) throw new Error("resident cannot advance")

if (!canStartWork("assigned", staff, assignedVendor)) throw new Error("staff can start assigned")
if (canStartWork("acknowledged", staff, request({ status: "acknowledged" }))) {
  throw new Error("cannot start before assign")
}
if (canStartWork("in_progress", metroVendor, { ...assignedVendor, status: "in_progress" })) {
  throw new Error("start work only from assigned")
}
if (canStartWork("assigned", otherVendor, assignedVendor)) {
  throw new Error("other vendor cannot start this job")
}

if (!canConfirmDone("in_progress", metroVendor, { ...assignedVendor, status: "in_progress" })) {
  throw new Error("assignee can confirm in progress")
}
if (canConfirmDone("assigned", staff, assignedVendor)) {
  throw new Error("cannot confirm done before start work")
}
if (canConfirmDone("in_progress", otherVendor, { ...assignedVendor, status: "in_progress" })) {
  throw new Error("other vendor cannot confirm this job")
}

if (!canRejectVerify("awaiting_verification")) throw new Error("reject only from awaiting")
if (canRejectVerify("in_progress")) throw new Error("cannot reject unless awaiting verify")

const withVendor = applyAssign(request({ status: "acknowledged" }), { kind: "vendor", vendorId: "metro-lift" }, "t")
if (withVendor.vendorId !== "metro-lift" || withVendor.staffAssigneeId || withVendor.status !== "assigned") {
  throw new Error("vendor assign must clear staff assignee")
}

const withStaff = applyAssign(withVendor, { kind: "staff", staffAssigneeId: "hasan@yopmail.com" }, "t2")
if (withStaff.staffAssigneeId !== "hasan@yopmail.com" || withStaff.vendorId || withStaff.status !== "assigned") {
  throw new Error("staff assign must clear vendor")
}

const parsedVendor = parseAssignValue("vendor:metro-lift")
if (!parsedVendor || parsedVendor.kind !== "vendor" || parsedVendor.vendorId !== "metro-lift") {
  throw new Error("parse vendor assign value")
}
const parsedStaff = parseAssignValue("staff:hasan@yopmail.com")
if (!parsedStaff || parsedStaff.kind !== "staff" || parsedStaff.staffAssigneeId !== "hasan@yopmail.com") {
  throw new Error("parse staff assign value")
}
if (parseAssignValue("nope")) throw new Error("invalid assign value")
if (assignValue({ kind: "vendor", vendorId: "metro-lift" }) !== "vendor:metro-lift") {
  throw new Error("assignValue vendor")
}

const people: Person[] = [
  { id: "hasan@yopmail.com", email: "hasan@yopmail.com", name: "Hasan", title: "Caretaker" },
  {
    id: "rafiq@yopmail.com",
    email: "rafiq@yopmail.com",
    name: "Rafiq",
    title: "Metro",
    vendorId: "metro-lift"
  },
  { id: "nusrat@yopmail.com", email: "nusrat@yopmail.com", name: "Nusrat", title: "Flat 7-B", flatId: "7-B" },
  { id: "invited@example.com", email: "invited@example.com", name: "New", title: "Staff" }
]
if (inHouseStaffPeople(people).map((item) => item.email).join() !== "hasan@yopmail.com,invited@example.com") {
  throw new Error("in-house staff is seed staff plus invited people without flat/vendor")
}
if (vendorContactEmail("metro-lift", people) !== "rafiq@yopmail.com") {
  throw new Error("vendor contact email")
}

if (currentAssignValue(assignedVendor) !== "vendor:metro-lift") throw new Error("current vendor value")
if (currentAssignValue(assignedStaff) !== "staff:hasan@yopmail.com") throw new Error("current staff value")

if (hasAfterPhoto(request())) throw new Error("no after photo yet")
if (!hasAfterPhoto(request(), { id: "e", kind: "after", label: "a", caption: "a", tone: "lift" })) {
  throw new Error("passed after photo counts")
}
if (
  !hasAfterPhoto(
    request({
      evidence: [{ id: "e", kind: "after", label: "a", caption: "a", tone: "lift" }]
    })
  )
) {
  throw new Error("existing after photo counts")
}

const rejected = applyRejectVerify(
  request({
    status: "awaiting_verification",
    completedAt: "2026-09-15T12:00:00.000Z",
    evidence: [{ id: "e", kind: "after", label: "a", caption: "a", tone: "lift" }],
    timeline: [
      { id: "t-done", at: "t", actorId: "hasan@yopmail.com", label: MARK_DONE_LABEL }
    ]
  })
)
if (rejected.status !== "in_progress" || rejected.completedAt) {
  throw new Error("not done must return to in progress and clear completedAt")
}

const rejectedOnRecord = {
  ...rejected,
  timeline: [
    ...rejected.timeline,
    { id: "t-reject", at: "t2", actorId: "nusrat@yopmail.com", label: REJECT_VERIFY_LABEL }
  ]
}
if (!needsNewAfterPhoto(rejectedOnRecord)) throw new Error("reject requires a new after photo")
if (hasAfterPhoto(rejectedOnRecord)) {
  throw new Error("stale after photo must not unlock confirm after not done")
}
if (
  !hasAfterPhoto(rejectedOnRecord, {
    id: "e2",
    kind: "after",
    label: "new",
    caption: "new",
    tone: "lift"
  })
) {
  throw new Error("a new after photo after not done unlocks confirm")
}

console.log("lifecycle check ok")
