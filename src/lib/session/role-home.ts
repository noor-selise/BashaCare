import { deskRoleFromSlugs, personFromEmail } from "@/data/directory"
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
  const role = deskRoleFromSlugs(roles) ?? personFromEmail(email)?.role ?? null
  return role ? roleHome(role) : null
}
