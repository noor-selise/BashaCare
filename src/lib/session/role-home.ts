import type { Role } from "@/types"

export const roleHome = (role: Role) => {
  switch (role) {
    case "resident":
      return "/resident"
    case "staff":
      return "/staff"
    case "committee":
      return "/committee"
    case "vendor":
      return "/vendor"
    default: {
      const _never: never = role
      return _never
    }
  }
}
