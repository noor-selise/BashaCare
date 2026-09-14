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
    if (userId) {
      await client.iam.users.updateAccess({ userId, roles: [input.role] })
    }
  }

  return savePerson({
    email: input.email,
    name: input.name,
    title: input.name,
    flatId: input.flatId,
    vendorId: input.vendorId
  })
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
        const res = (await client.iam.users.list({ pageNo: 1, pageSize: 1, search: email })) as {
          items?: { email?: string; isActive?: boolean }[]
          data?: { items?: { email?: string; isActive?: boolean }[] }
        }
        const match = (res.data?.items ?? res.items ?? [])[0]
        status[email] = match ? (match.isActive ? "active" : "pending") : "unknown"
      } catch {
        status[email] = "unknown"
      }
    })
  )

  return status
}
