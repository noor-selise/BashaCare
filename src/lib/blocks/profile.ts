import { getBlocksClient } from "@/lib/blocks/client"
import { updatePersonProfile } from "@/lib/blocks/building-data"
import type { Person } from "@/types"

export type ProfilePatch = Pick<Person, "name" | "title" | "photoFileId" | "photoMimeType">

export const saveOwnProfile = async (email: string, patch: ProfilePatch, existing?: Person) => {
  const person = await updatePersonProfile(email, patch, existing)
  const client = getBlocksClient()
  if (!client) return person

  const [firstName, ...rest] = patch.name.trim().split(/\s+/)
  const lastName = rest.join(" ") || firstName
  try {
    await client.iam.updateMe({ firstName, lastName })
  } catch {
    // Person row is the desk source of truth; IAM sync is best-effort.
  }

  return person
}
