import type { Category, RequestRecord, Urgency } from "@/types"

export const proposeFromMessage = (
  message: string,
  history: RequestRecord[]
): {
  category: Category
  urgency: Urgency
  reason: string
  draftReply: string
  replaceRecommendation?: string
} => {
  const text = message.toLowerCase()
  const category: Category = text.includes("lift") || text.includes("lift ta")
    ? "lift"
    : text.includes("pump") || text.includes("pani") || text.includes("water") || text.includes("leak")
      ? "water"
      : text.includes("light") || text.includes("electric")
        ? "electrical"
        : text.includes("park")
          ? "parking"
          : text.includes("garden") || text.includes("gach")
            ? "garden"
            : "other"

  const isEmergency = /shaft|fire|trapped|bonna|namte parsi na|burst/.test(text)
  const claimsEmergency = /\bemergency\b/.test(text)
  const negatedUrgent = /\bnot\s+urgent\b|\bnon-urgent\b/.test(text)
  const claimsUrgent = /\burgent\b/.test(text) && !negatedUrgent
  const urgency: Urgency = isEmergency
    ? "emergency"
    : claimsEmergency
      ? "emergency"
      : claimsUrgent || /jam|kharap|again/.test(text)
        ? "urgent"
        : "routine"

  const reason = isEmergency
    ? "Message describes a life-safety or structural risk (burst, trapped, shaft)."
    : claimsEmergency
      ? "Resident labelled this an emergency. Staff should confirm — intermittent lift faults are often urgent, not emergency."
      : claimsUrgent
        ? "Resident marked urgent — not life-safety. Staff should confirm priority."
        : /jam|kharap|again/.test(text)
          ? "Repeat or blocking fault language — queue as urgent unless staff downgrade."
          : "No life-safety language. Queue as routine or urgent by delay."

  const equipmentHits = history.filter((item) => {
    return item.equipmentId && item.status === "verified_closed"
  })
  const replaceRecommendation = equipmentHits.length >= 5
    ? `This vendor has ${equipmentHits.length} closed repairs on the same equipment. Recommend replace, not another patch.`
    : undefined

  const draftReply = urgency === "emergency"
    ? "We have this as an emergency. Staff are being notified now. Please stay clear of the lift until we update you."
    : "We have your request. You will see status here — no need to call the caretaker."

  return { category, urgency, reason, draftReply, replaceRecommendation }
}
