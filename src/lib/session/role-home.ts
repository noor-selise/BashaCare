import { deskRoleFromSlugs, demoRoleFromEmail } from "@/data/directory"
import type { Role } from "@/types"

export const roleHome = (role: Role) => {
  switch (role) {
    case "resident":
      return "/resident"
    case "staff":
      return "/staff"
    case "admin":
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

export const deskPathFromAuth = (roles: string[], email?: string | null) => {
  const role = deskRoleFromSlugs(roles) ?? demoRoleFromEmail(email)
  return role ? roleHome(role) : null
}
