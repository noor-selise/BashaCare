import { getBlocksClient } from "@/lib/blocks/client"
import type { BlocksClient } from "@seliseblocks/client"

const EVIDENCE_DIR_NAME = "BashaCare Evidence"
const CONFIGURATION_NAME = "Default"
const CLOUD_DIR_NAME = "Cloud"
const DEFAULT_DIR_NAME = "Default"

let cachedDirectoryId: string | null = null

type PresignResult = {
  uploadUrl?: string
  fileId?: string | null
  isSuccess?: boolean
  errors?: unknown
  data?: { uploadUrl?: string; fileId?: string; isSuccess?: boolean }
}

type FileGetResult = {
  downloadUrl?: string
  url?: string
  data?: { downloadUrl?: string; url?: string }
}

type StorageObject = {
  id?: string
  itemId?: string
  name?: string
  type?: string
}

const objectId = (item: StorageObject) => item.itemId ?? item.id ?? null

const isDirectory = (item: StorageObject) => item.type?.toLowerCase() === "directory"

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
  const isSuccess = result.isSuccess ?? result.data?.isSuccess

  if (isSuccess === false) {
    const detail =
      typeof uploadUrl === "string" && !uploadUrl.startsWith("http")
        ? uploadUrl
        : JSON.stringify(result.errors ?? result)
    throw new Error(detail || "Could not start file upload.")
  }

  if (!uploadUrl || !fileId || !uploadUrl.startsWith("http")) {
    throw new Error("Could not start file upload — missing pre-signed URL.")
  }

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

const listChildren = async (
  client: BlocksClient,
  parentDirectoryId?: string
): Promise<StorageObject[]> => {
  const listed = await client.data.objects.list(
    parentDirectoryId ? { parentDirectoryId, limit: 100 } : { limit: 100 }
  )
  return ((listed as { items?: StorageObject[] }).items ?? []) as StorageObject[]
}

const findNamedDirectory = async (
  client: BlocksClient,
  name: string,
  parentDirectoryId?: string
): Promise<string | null> => {
  const items = await listChildren(client, parentDirectoryId)
  const match = items.find((item) => isDirectory(item) && item.name === name)
  return match ? objectId(match) : null
}

/**
 * Resolve /Cloud/Default/BashaCare Evidence for image uploads.
 * Uses data.files.presignedUploadUrl (Blocks get-pre-signed-url-for-upload).
 */
const ensureEvidenceDirectory = async (client: BlocksClient): Promise<string> => {
  if (cachedDirectoryId) return cachedDirectoryId

  try {
    const existing = await client.data.objects.search({
      query: EVIDENCE_DIR_NAME,
      type: "directory",
      limit: 25
    })
    const hit = ((existing as { items?: StorageObject[] }).items ?? []).find(
      (item) => isDirectory(item) && item.name === EVIDENCE_DIR_NAME
    )
    const hitId = hit ? objectId(hit) : null
    if (hitId) {
      cachedDirectoryId = hitId
      return hitId
    }
  } catch {
    // Fall through to browse + create.
  }

  let cloudId: string | null
  let defaultId: string | null
  try {
    cloudId = await findNamedDirectory(client, CLOUD_DIR_NAME)
    if (!cloudId) throw new Error("Cloud storage root was not found on this tenant.")
    defaultId = await findNamedDirectory(client, DEFAULT_DIR_NAME, cloudId)
    if (!defaultId) throw new Error("Default storage folder was not found under Cloud.")
  } catch (caught) {
    throw new Error(storageErrorMessage(caught, "Could not open evidence storage"))
  }

  const underDefault = await findNamedDirectory(client, EVIDENCE_DIR_NAME, defaultId)
  if (underDefault) {
    cachedDirectoryId = underDefault
    return underDefault
  }

  // Do not set allowedFileExtensions — an explicit allow-list currently rejects
  // matching image uploads on this tenant; empty means inherit parent (all types).
  let created: unknown
  try {
    created = await client.data.directories.create({
      name: EVIDENCE_DIR_NAME,
      parentDirectoryId: defaultId,
      configurationName: CONFIGURATION_NAME
    })
  } catch (caught) {
    throw new Error(storageErrorMessage(caught, "Could not create evidence storage folder"))
  }

  const directoryId =
    (created as { id?: string; directoryId?: string; itemId?: string; data?: { id?: string } })
      .directoryId ??
    (created as { itemId?: string }).itemId ??
    (created as { id?: string }).id ??
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

const uploadStorageImage = async (
  file: File,
  nameStem: string
): Promise<{ fileId: string; mimeType: string }> => {
  const client = getBlocksClient()
  if (!client) throw new Error("Blocks is not configured — photo upload needs hosted storage.")

  const directoryId = await ensureEvidenceDirectory(client)
  const name = `${nameStem}.${extensionFrom(file)}`

  // Cloud Azure path: get-pre-signed-url-for-upload, then PUT bytes (no Blocks auth on PUT).
  let presign: unknown
  try {
    presign = await client.data.files.presignedUploadUrl({
      name,
      parentDirectoryId: directoryId,
      configurationName: CONFIGURATION_NAME,
      accessModifier: "Private"
    })
  } catch (caught) {
    throw new Error(storageErrorMessage(caught, "Could not get pre-signed upload URL"))
  }

  const { uploadUrl, fileId } = readPresign(presign)

  try {
    await client.data.files.uploadToUrl({
      url: uploadUrl,
      body: file,
      contentType: file.type || "application/octet-stream"
    })
  } catch (caught) {
    throw new Error(storageErrorMessage(caught, "Could not upload photo to storage"))
  }

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
