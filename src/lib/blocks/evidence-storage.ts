import { getBlocksClient } from "@/lib/blocks/client"
import type { BlocksClient } from "@seliseblocks/client"

const EVIDENCE_DIR_NAME = "BashaCare Evidence"
const CONFIGURATION_NAME = "Default"

let cachedDirectoryId: string | null = null

type PresignResult = {
  uploadUrl?: string
  fileId?: string
  isSuccess?: boolean
  data?: { uploadUrl?: string; fileId?: string }
}

type FileGetResult = {
  downloadUrl?: string
  url?: string
  data?: { downloadUrl?: string; url?: string }
}

const extensionFrom = (file: File) => {
  const fromName = file.name.split(".").pop()?.toLowerCase()
  if (fromName && fromName.length <= 5) return fromName
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

const readPresign = (response: unknown): { uploadUrl: string; fileId: string } => {
  const result = response as PresignResult
  const uploadUrl = result.uploadUrl ?? result.data?.uploadUrl
  const fileId = result.fileId ?? result.data?.fileId
  if (!uploadUrl || !fileId) throw new Error("Could not start file upload.")
  return { uploadUrl, fileId }
}

const readDownloadUrl = (response: unknown): string | null => {
  const result = response as FileGetResult
  return result.downloadUrl ?? result.url ?? result.data?.downloadUrl ?? result.data?.url ?? null
}

const storageErrorMessage = (caught: unknown, action: string): string => {
  if (caught instanceof Error && caught.message.trim()) {
    if (/403|forbidden|unauthorized|401/i.test(caught.message)) {
      return `${action}: your account does not have file-storage access on this tenant. Try an admin account, or ask the tenant owner to grant storage permissions to your IAM role.`
    }
    return `${action}: ${caught.message}`
  }
  return `${action}: file storage is unavailable on this tenant.`
}

const findEvidenceDirectory = async (client: BlocksClient): Promise<string | null> => {
  try {
    const listed = await client.data.objects.list({ parentDirectoryId: "root", limit: 100 })
    const items = (listed as { items?: Array<{ id?: string; name?: string; type?: string }> }).items ?? []
    const match = items.find((item) => item.type === "Directory" && item.name === EVIDENCE_DIR_NAME)
    return match?.id ?? null
  } catch (caught) {
    throw new Error(storageErrorMessage(caught, "Could not open evidence storage"))
  }
}

const ensureEvidenceDirectory = async (client: BlocksClient): Promise<string> => {
  if (cachedDirectoryId) return cachedDirectoryId

  const existing = await findEvidenceDirectory(client)
  if (existing) {
    cachedDirectoryId = existing
    return existing
  }

  let created: unknown
  try {
    created = await client.data.directories.create({
      name: EVIDENCE_DIR_NAME,
      parentDirectoryId: "root",
      allowedFileExtensions: ["jpg", "jpeg", "png", "webp", "gif"]
    })
  } catch (caught) {
    throw new Error(storageErrorMessage(caught, "Could not create evidence storage folder"))
  }

  const directoryId =
    (created as { id?: string; directoryId?: string; data?: { id?: string } }).id ??
    (created as { directoryId?: string }).directoryId ??
    (created as { data?: { id?: string } }).data?.id

  if (!directoryId) throw new Error("Could not create evidence storage directory.")

  cachedDirectoryId = directoryId
  return directoryId
}

export const uploadEvidenceFile = async (
  file: File,
  requestId: string,
  kind: "before" | "after"
): Promise<{ fileId: string; mimeType: string }> => {
  return uploadStorageImage(file, `${requestId}-${kind}-${Date.now()}`)
}

export const uploadProfilePhoto = async (
  email: string,
  file: File
): Promise<{ fileId: string; mimeType: string }> => {
  const slug = email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return uploadStorageImage(file, `profile-${slug}-${Date.now()}`)
}

const uploadStorageImage = async (file: File, nameStem: string): Promise<{ fileId: string; mimeType: string }> => {
  const client = getBlocksClient()
  if (!client) throw new Error("Blocks is not configured — photo upload needs hosted storage.")

  const directoryId = await ensureEvidenceDirectory(client)
  const name = `${nameStem}.${extensionFrom(file)}`

  const presign = await client.data.files.presignedUploadUrl({
    name,
    parentDirectoryId: directoryId,
    configurationName: CONFIGURATION_NAME,
    accessModifier: "Private"
  })

  const { uploadUrl, fileId } = readPresign(presign)

  await client.data.files.uploadToUrl({
    url: uploadUrl,
    body: file,
    contentType: file.type || "application/octet-stream"
  })

  return { fileId, mimeType: file.type || "application/octet-stream" }
}

export const evidenceDownloadUrl = async (fileId: string): Promise<string | null> => {
  const client = getBlocksClient()
  if (!client) return null

  try {
    const file = await client.data.files.get(fileId, { configurationName: CONFIGURATION_NAME })
    return readDownloadUrl(file)
  } catch {
    return null
  }
}

export const storageDownloadUrl = evidenceDownloadUrl
