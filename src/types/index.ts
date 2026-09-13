export type Role = "resident" | "staff" | "committee" | "vendor"

export type Urgency = "emergency" | "urgent" | "routine"

export type RequestStatus =
  | "submitted"
  | "acknowledged"
  | "assigned"
  | "in_progress"
  | "awaiting_verification"
  | "verified_closed"
  | "rejected"

export type Category =
  | "lift"
  | "water"
  | "electrical"
  | "plumbing"
  | "parking"
  | "garden"
  | "other"

export type Actor = {
  id: string
  name: string
  role: Role
  flatId?: string
  vendorId?: string
  title: string
}

export type Vendor = {
  id: string
  name: string
  trade: string
}

export type Evidence = {
  id: string
  kind: "before" | "after"
  label: string
  caption: string
  tone: "lift" | "water" | "pump" | "other"
}

export type TimelineEvent = {
  id: string
  at: string
  actorId: string
  label: string
  detail?: string
}

export type AiSuggestion = {
  category: Category
  urgency: Urgency
  reason: string
  draftReply: string
  replaceRecommendation?: string
}

export type RequestRecord = {
  id: string
  flatId: string
  residentId: string
  message: string
  category: Category
  urgency: Urgency
  status: RequestStatus
  vendorId?: string
  equipmentId?: string
  cost?: number
  costCategory?: string
  createdAt: string
  acknowledgedAt?: string
  assignedAt?: string
  completedAt?: string
  verifiedAt?: string
  evidence: Evidence[]
  timeline: TimelineEvent[]
  ai?: AiSuggestion
  staffOverride?: {
    from: Urgency
    to: Urgency
    reason: string
    actorId: string
  }
  staffReply?: string
}

export type Decision = {
  id: string
  title: string
  body: string
  vendorId: string
  equipmentId: string
  at: string
  actorId: string
}

export type Notice = {
  id: string
  role: Role | "all"
  title: string
  body: string
  requestId?: string
  at: string
  read: boolean
}

export type Session = {
  actorId: string
  role: Role
}
