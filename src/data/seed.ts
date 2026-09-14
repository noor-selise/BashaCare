import type { BuildingInfo, Decision, Flat, Notice, Person, RequestRecord, Role } from "@/types"

const pumpCosts = [6000, 6500, 7000, 5500, 8000, 5500]

const pumpDates = [
  "2026-04-03T09:10:00.000Z",
  "2026-05-08T10:20:00.000Z",
  "2026-06-12T08:40:00.000Z",
  "2026-07-19T11:05:00.000Z",
  "2026-08-04T09:30:00.000Z",
  "2026-08-28T14:15:00.000Z"
]

const pumpJobs: RequestRecord[] = pumpCosts.map((cost, index) => {
  const safeCreated = pumpDates[index]
  return {
    id: `pump-${index + 1}`,
    flatId: "common",
    residentId: "hasan@yopmail.com",
    message: `Roof pump failed again. Patch ${index + 1} of the season.`,
    category: "water",
    urgency: "urgent",
    status: "verified_closed",
    vendorId: "rahman-pump",
    equipmentId: "roof-pump",
    cost,
    costCategory: "Water pump",
    createdAt: safeCreated,
    acknowledgedAt: safeCreated,
    assignedAt: safeCreated,
    completedAt: safeCreated,
    verifiedAt: safeCreated,
    evidence: [
      {
        id: `pump-${index + 1}-after`,
        kind: "after",
        label: "After",
        caption: `Patch ${index + 1} · Rahman Pump`,
        tone: "pump"
      }
    ],
    timeline: [
      { id: `pump-${index + 1}-c`, at: safeCreated, actorId: "hasan@yopmail.com", label: "Closed as another patch" }
    ]
  }
})

export const PUMP_TOTAL = pumpCosts.reduce((sum, value) => sum + value, 0)

export const seedRequests: RequestRecord[] = [
  ...pumpJobs,
  {
    id: "req-7b-lift",
    flatId: "7-B",
    residentId: "nusrat@yopmail.com",
    message: "lift ta again kharap hocche, 3 din dhore majhe majhe jame, ami bonna ke niye 4 thake namte parsi na, emergency.",
    category: "lift",
    urgency: "emergency",
    status: "submitted",
    equipmentId: "passenger-lift",
    createdAt: "2026-09-13T08:12:00.000Z",
    evidence: [
      {
        id: "7b-before",
        kind: "before",
        label: "Before",
        caption: "Cabin doors ajar, floor 4 · Nusrat",
        tone: "lift"
      }
    ],
    timeline: [
      { id: "7b-sub", at: "2026-09-13T08:12:00.000Z", actorId: "nusrat@yopmail.com", label: "Request submitted" }
    ],
    ai: {
      category: "lift",
      urgency: "emergency",
      reason: "Resident labelled this an emergency. Staff should confirm — intermittent lift faults are often urgent, not emergency.",
      draftReply: "We have this as an emergency. Staff are being notified now. Please stay clear of the lift until we update you."
    }
  },
  {
    id: "req-10a-shaft",
    flatId: "10-A",
    residentId: "karim@yopmail.com",
    message: "Water leaking into the lift shaft from 10-A bathroom. Floor is wet. This is not a drip — it is running.",
    category: "water",
    urgency: "emergency",
    status: "submitted",
    equipmentId: "passenger-lift",
    createdAt: "2026-09-13T09:04:00.000Z",
    evidence: [
      {
        id: "10a-before",
        kind: "before",
        label: "Before",
        caption: "Water at shaft door, level 10 · Karim",
        tone: "water"
      }
    ],
    timeline: [
      { id: "10a-sub", at: "2026-09-13T09:04:00.000Z", actorId: "karim@yopmail.com", label: "Request submitted" }
    ],
    ai: {
      category: "water",
      urgency: "emergency",
      reason: "Message describes a life-safety or structural risk (leak, trapped, shaft).",
      draftReply: "We have this as an emergency. Staff are being notified now. Please stay clear of the lift until we update you."
    }
  }
]

export const seedDecisions: Decision[] = [
  {
    id: "dec-replace-pump",
    title: "Replace the roof pump",
    body: "Six patches in five months, ৳38,500 to Rahman Pump Service. Do not repair again. Replace the machine.",
    vendorId: "rahman-pump",
    equipmentId: "roof-pump",
    at: "2026-09-01T16:00:00.000Z",
    actorId: "rina@yopmail.com"
  }
]

export const seedNotices: Notice[] = [
  {
    id: "n-shaft",
    role: "staff",
    title: "Emergency: water in the lift shaft",
    body: "Flat 10-A. Acknowledge first. Do not treat this as a routine leak.",
    requestId: "req-10a-shaft",
    at: "2026-09-13T09:04:00.000Z",
    read: false
  },
  {
    id: "n-7b",
    role: "staff",
    title: "New request from 7-B",
    body: "Lift jam. AI marked emergency — confirm or downgrade.",
    requestId: "req-7b-lift",
    at: "2026-09-13T08:12:00.000Z",
    read: false
  }
]

export const seedCast: (Person & { role: Role })[] = [
  { id: "noor@yopmail.com", email: "noor@yopmail.com", name: "Noor Mohammad", role: "admin", title: "Admin" },
  {
    id: "nusrat@yopmail.com",
    email: "nusrat@yopmail.com",
    name: "Nusrat Rahman",
    role: "resident",
    flatId: "7-B",
    title: "Flat 7-B"
  },
  {
    id: "karim@yopmail.com",
    email: "karim@yopmail.com",
    name: "Karim Hossain",
    role: "resident",
    flatId: "10-A",
    title: "Flat 10-A"
  },
  { id: "hasan@yopmail.com", email: "hasan@yopmail.com", name: "Hasan Mia", role: "staff", title: "Caretaker" },
  {
    id: "rina@yopmail.com",
    email: "rina@yopmail.com",
    name: "Rina Chowdhury",
    role: "committee",
    title: "Treasurer"
  },
  {
    id: "rafiq@yopmail.com",
    email: "rafiq@yopmail.com",
    name: "Rafiq Uddin",
    role: "vendor",
    vendorId: "metro-lift",
    title: "Metro Lift AMC"
  },
  {
    id: "rahman@yopmail.com",
    email: "rahman@yopmail.com",
    name: "Abdur Rahman",
    role: "vendor",
    vendorId: "rahman-pump",
    title: "Rahman Pump Service"
  }
]

export const seedPeople: Person[] = seedCast.map((item) => ({
  id: item.id,
  email: item.email,
  name: item.name,
  title: item.title,
  flatId: item.flatId,
  vendorId: item.vendorId
}))

export const seedFlats: Flat[] = [
  { id: "7-B", label: "7-B", floor: 7, status: "occupied" },
  { id: "10-A", label: "10-A", floor: 10, status: "occupied" }
]

export const seedBuildingInfo: BuildingInfo = {
  name: "Uttara Heights",
  addressLine: "House 18, Road 7, Uttara",
  storeys: 12,
  flatCount: 48,
  fee: 2500
}

