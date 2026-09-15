import { canConfirmAi } from "./override"

if (!canConfirmAi("urgent", "urgent", "")) {
  throw new Error("confirming the proposed urgency does not need a reason")
}

if (canConfirmAi("urgent", "routine", "")) {
  throw new Error("override with an empty reason must be blocked")
}

if (canConfirmAi("urgent", "routine", "   ")) {
  throw new Error("override with a blank reason must be blocked")
}

if (!canConfirmAi("urgent", "routine", "Intermittent jam is urgent, not emergency.")) {
  throw new Error("override with a reason must be allowed")
}

console.log("override-check ok: Override AI requires a non-empty reason")
