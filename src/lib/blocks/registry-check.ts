import { accessStatusFromIamList } from "./registry-status"

const nested = accessStatusFromIamList(
  ["karim@yopmail.com", "amin@yopmail.com"],
  {
    data: {
      data: [
        {
          email: "karim@yopmail.com",
          active: true
        }
      ]
    }
  }
)

if (nested["karim@yopmail.com"] !== "active") {
  throw new Error(`nested IAM list should mark Karim active, got ${nested["karim@yopmail.com"]}`)
}

if (nested["amin@yopmail.com"] !== "unknown") {
  throw new Error(`missing IAM user should stay unknown, got ${nested["amin@yopmail.com"]}`)
}

const flat = accessStatusFromIamList(["Karim@yopmail.com"], {
  data: [{ email: "karim@yopmail.com", active: true }]
})

if (flat["Karim@yopmail.com"] !== "active") {
  throw new Error("email match must be case-insensitive")
}

const pending = accessStatusFromIamList(["nusrat@yopmail.com"], {
  data: { items: [{ userName: "nusrat@yopmail.com", active: false }] }
})

if (pending["nusrat@yopmail.com"] !== "pending") {
  throw new Error(`inactive IAM user should be pending, got ${pending["nusrat@yopmail.com"]}`)
}

console.log("registry-check ok: nested IAM list envelopes parse to Active")
