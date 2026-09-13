const DEMO_NOW = Date.parse("2026-09-13T12:00:00.000Z")

export const formatWhen = (iso: string) => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dhaka"
  }).format(new Date(iso))
}

export const formatAge = (iso: string) => {
  const ms = DEMO_NOW - new Date(iso).getTime()
  const hours = Math.max(1, Math.round(ms / 36e5))
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export const statusLabel = (status: string) => {
  switch (status) {
    case "submitted":
      return "Submitted"
    case "acknowledged":
      return "Acknowledged"
    case "assigned":
      return "Assigned"
    case "in_progress":
      return "In progress"
    case "awaiting_verification":
      return "Awaiting verification"
    case "verified_closed":
      return "Verified closed"
    case "rejected":
      return "Rejected"
    default:
      return status
  }
}

export const urgencyLabel = (urgency: string) => {
  switch (urgency) {
    case "emergency":
      return "Emergency"
    case "urgent":
      return "Urgent"
    case "routine":
      return "Routine"
    default:
      return urgency
  }
}

export const categoryLabel = (category: string) => {
  switch (category) {
    case "lift":
      return "Lift"
    case "water":
      return "Water"
    case "electrical":
      return "Electrical"
    case "plumbing":
      return "Plumbing"
    case "parking":
      return "Parking"
    case "garden":
      return "Garden"
    case "other":
      return "Other"
    default:
      return category
  }
}

