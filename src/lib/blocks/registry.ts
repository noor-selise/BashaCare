import { savePerson } from "@/lib/blocks/building-data"
import { getBlocksClient } from "@/lib/blocks/client"
import type { Person, Role } from "@/types"

export type InviteInput = {
  name: string
  email: string
  role: Exclude<Role, "admin">
  flatId?: string
  vendorId?: string
}

export const invitePerson = async (input: InviteInput): Promise<Person> => {
  const client = getBlocksClient()
  if (client) {
    const [firstName, ...rest] = input.name.trim().split(" ")
    const created = (await client.iam.users.create({
      email: input.email,
      firstName: firstName || input.name,
      lastName: rest.join(" ") || firstName || input.name,
      roles: [input.role]
    })) as { userId?: string; itemId?: string; data?: { userId?: string; itemId?: string } }
    const userId = created.userId ?? created.itemId ?? created.data?.userId ?? created.data?.itemId
    // Fail loudly rather than writing a Person row for an account that never got its role —
    // that user would otherwise log in to "No desk for this account" with no diagnostic.
    if (!userId) {
      throw new Error(
        "Could not determine the new user's id from IAM's response — invite did not complete. No Person row was created."
      )
    }
    await client.iam.users.updateAccess({ userId, roles: [input.role] })
  }

  return savePerson({
    email: input.email,
    name: input.name,
    title: input.name,
    flatId: input.flatId,
    vendorId: input.vendorId
  })
}

type IamUserRow = {
  email?: string
  active?: boolean
  isActive?: boolean
}

const readIamUsers = (response: unknown): IamUserRow[] => {
  const record = response as {
    data?: IamUserRow[] | { items?: IamUserRow[] }
    items?: IamUserRow[]
  }
  if (Array.isArray(record.data)) return record.data
  if (record.data && Array.isArray(record.data.items)) return record.data.items
  return record.items ?? []
}

const iamUserIsActive = (user: IamUserRow) => {
  if (typeof user.active === "boolean") return user.active
  if (typeof user.isActive === "boolean") return user.isActive
  return false
}

export const listAccessStatus = async (
  emails: string[]
): Promise<Record<string, "pending" | "active" | "unknown">> => {
  const client = getBlocksClient()
  const status: Record<string, "pending" | "active" | "unknown"> = {}
  if (!client || emails.length === 0) return status

  await Promise.all(
    emails.map(async (email) => {
      try {
        const res = await client.iam.users.list({ pageNo: 1, pageSize: 1, search: email })
        const match = readIamUsers(res).find(
          (user) => user.email?.trim().toLowerCase() === email.trim().toLowerCase()
        )
        status[email] = match ? (iamUserIsActive(match) ? "active" : "pending") : "unknown"
      } catch {
        status[email] = "unknown"
      }
    })
  )

  return status
}
