export type AccessStatus = "pending" | "active" | "unknown"

export type IamUserRow = {
  email?: string
  Email?: string
  userName?: string
  active?: boolean
  isActive?: boolean
  status?: number
}

const emailOf = (user: IamUserRow) => {
  const value = user.email ?? user.Email ?? user.userName
  return typeof value === "string" ? value.trim().toLowerCase() : ""
}

export const readIamUsers = (response: unknown): IamUserRow[] => {
  const record = response as {
    data?: IamUserRow[] | { data?: IamUserRow[]; items?: IamUserRow[] }
    items?: IamUserRow[]
  }
  if (Array.isArray(record.data)) return record.data
  if (record.data && Array.isArray(record.data.data)) return record.data.data
  if (record.data && Array.isArray(record.data.items)) return record.data.items
  return record.items ?? []
}

export const iamUserIsActive = (user: IamUserRow) => {
  if (typeof user.active === "boolean") return user.active
  if (typeof user.isActive === "boolean") return user.isActive
  if (user.status === 1) return true
  return false
}

export const accessStatusFromIamList = (
  emails: string[],
  response: unknown
): Record<string, AccessStatus> => {
  const byEmail = new Map<string, IamUserRow>()
  for (const user of readIamUsers(response)) {
    const email = emailOf(user)
    if (email) byEmail.set(email, user)
  }

  const status: Record<string, AccessStatus> = {}
  for (const email of emails) {
    const match = byEmail.get(email.trim().toLowerCase())
    status[email] = match ? (iamUserIsActive(match) ? "active" : "pending") : "unknown"
  }
  return status
}
