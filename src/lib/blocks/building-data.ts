import { seedDecisions, seedNotices, seedRequests } from "@/data/seed"
import { vendors as directoryVendors } from "@/data/directory"
import { getBlocksClient } from "@/lib/blocks/client"
import type { Decision, Notice, RequestRecord, Vendor } from "@/types"

type RequestRow = Record<string, unknown> & {
  itemId?: string
  ItemId?: string
  flatId?: string
  residentId?: string
  message?: string
  category?: RequestRecord["category"]
  urgency?: RequestRecord["urgency"]
  status?: RequestRecord["status"]
  vendorId?: string
  equipmentId?: string
  cost?: number
  costCategory?: string
  createdAt?: string
  acknowledgedAt?: string
  assignedAt?: string
  completedAt?: string
  verifiedAt?: string
  evidenceJson?: string
  timelineJson?: string
  aiJson?: string
  staffOverrideJson?: string
  staffReply?: string
}

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string" || !value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const rowId = (row: { itemId?: string; ItemId?: string; id?: string }) => {
  return String(row.itemId ?? row.ItemId ?? row.id ?? "")
}

const requestFromRow = (row: RequestRow): RequestRecord => {
  return {
    id: rowId(row),
    flatId: String(row.flatId ?? ""),
    residentId: String(row.residentId ?? ""),
    message: String(row.message ?? ""),
    category: (row.category ?? "other") as RequestRecord["category"],
    urgency: (row.urgency ?? "routine") as RequestRecord["urgency"],
    status: (row.status ?? "submitted") as RequestRecord["status"],
    vendorId: row.vendorId ? String(row.vendorId) : undefined,
    equipmentId: row.equipmentId ? String(row.equipmentId) : undefined,
    cost: typeof row.cost === "number" ? row.cost : undefined,
    costCategory: row.costCategory ? String(row.costCategory) : undefined,
    createdAt: String(row.createdAt ?? ""),
    acknowledgedAt: row.acknowledgedAt ? String(row.acknowledgedAt) : undefined,
    assignedAt: row.assignedAt ? String(row.assignedAt) : undefined,
    completedAt: row.completedAt ? String(row.completedAt) : undefined,
    verifiedAt: row.verifiedAt ? String(row.verifiedAt) : undefined,
    evidence: parseJson(row.evidenceJson, []),
    timeline: parseJson(row.timelineJson, []),
    ai: parseJson(row.aiJson, undefined),
    staffOverride: parseJson(row.staffOverrideJson, undefined),
    staffReply: row.staffReply ? String(row.staffReply) : undefined
  }
}

const requestToRow = (item: RequestRecord) => {
  return {
    flatId: item.flatId,
    residentId: item.residentId,
    message: item.message,
    category: item.category,
    urgency: item.urgency,
    status: item.status,
    vendorId: item.vendorId ?? "",
    equipmentId: item.equipmentId ?? "",
    cost: item.cost ?? 0,
    costCategory: item.costCategory ?? "",
    createdAt: item.createdAt,
    acknowledgedAt: item.acknowledgedAt ?? "",
    assignedAt: item.assignedAt ?? "",
    completedAt: item.completedAt ?? "",
    verifiedAt: item.verifiedAt ?? "",
    evidenceJson: JSON.stringify(item.evidence),
    timelineJson: JSON.stringify(item.timeline),
    aiJson: JSON.stringify(item.ai ?? null),
    staffOverrideJson: JSON.stringify(item.staffOverride ?? null),
    staffReply: item.staffReply ?? ""
  }
}

const listItems = <T,>(response: unknown, key: string): T[] => {
  const record = response as {
    data?: Record<string, { items?: T[] }>
    items?: T[]
  }
  return record.data?.[key]?.items ?? record.items ?? []
}

export const loadBuildingRecords = async () => {
  const client = getBlocksClient()
  if (!client) {
    return { requests: [] as RequestRecord[], decisions: [] as Decision[], notices: [] as Notice[], vendors: directoryVendors }
  }

  const requestsApi = client.data.collection<RequestRow>("Request", {
    fields: [
      "flatId",
      "residentId",
      "message",
      "category",
      "urgency",
      "status",
      "vendorId",
      "equipmentId",
      "cost",
      "costCategory",
      "createdAt",
      "acknowledgedAt",
      "assignedAt",
      "completedAt",
      "verifiedAt",
      "evidenceJson",
      "timelineJson",
      "aiJson",
      "staffOverrideJson",
      "staffReply"
    ]
  })
  const decisionsApi = client.data.collection<Decision & { itemId?: string }>("Decision", {
    fields: ["title", "body", "vendorId", "equipmentId", "at", "actorId"]
  })
  const noticesApi = client.data.collection<Notice & { itemId?: string }>("Notice", {
    fields: ["role", "title", "body", "requestId", "at", "read"]
  })
  const vendorsApi = client.data.collection<Vendor & { itemId?: string; slug?: string }>("Vendor", {
    fields: ["name", "trade"]
  })

  const [requestRes, decisionRes, noticeRes, vendorRes] = await Promise.all([
    requestsApi.list({ pageNo: 1, pageSize: 100 }),
    decisionsApi.list({ pageNo: 1, pageSize: 50 }),
    noticesApi.list({ pageNo: 1, pageSize: 50 }),
    vendorsApi.list({ pageNo: 1, pageSize: 20 })
  ])

  const vendorRows = listItems<Vendor & { itemId?: string; name?: string }>(vendorRes, "getVendors")
  const vendors = vendorRows.length
    ? vendorRows.map((row) => {
        const match = directoryVendors.find((item) => item.name === row.name)
        return {
          id: match?.id ?? rowId(row),
          name: String(row.name ?? ""),
          trade: String(row.trade ?? "")
        }
      })
    : directoryVendors

  return {
    requests: listItems<RequestRow>(requestRes, "getRequests").map(requestFromRow),
    decisions: listItems<Decision & { itemId?: string }>(decisionRes, "getDecisions").map((row) => ({
      id: rowId(row),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      vendorId: String(row.vendorId ?? ""),
      equipmentId: String(row.equipmentId ?? ""),
      at: String(row.at ?? ""),
      actorId: String(row.actorId ?? "")
    })),
    notices: listItems<Notice & { itemId?: string }>(noticeRes, "getNotices").map((row) => ({
      id: rowId(row),
      role: (row.role ?? "all") as Notice["role"],
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      requestId: row.requestId ? String(row.requestId) : undefined,
      at: String(row.at ?? ""),
      read: Boolean(row.read)
    })),
    vendors
  }
}

export const seedBuildingRecords = async () => {
  const client = getBlocksClient()
  if (!client) return false

  const requestsApi = client.data.collection("Request")
  const existing = await requestsApi.list({ pageNo: 1, pageSize: 1 })
  const already = listItems(existing, "getRequests")
  if (already.length) return false

  const vendorsApi = client.data.collection("Vendor")
  const decisionsApi = client.data.collection("Decision")
  const noticesApi = client.data.collection("Notice")

  for (const vendor of directoryVendors) {
    await vendorsApi.create({ name: vendor.name, trade: vendor.trade })
  }

  for (const item of seedRequests) {
    await requestsApi.create(requestToRow(item))
  }

  for (const item of seedDecisions) {
    await decisionsApi.create({
      title: item.title,
      body: item.body,
      vendorId: item.vendorId,
      equipmentId: item.equipmentId,
      at: item.at,
      actorId: item.actorId
    })
  }

  for (const item of seedNotices) {
    await noticesApi.create({
      role: item.role,
      title: item.title,
      body: item.body,
      requestId: item.requestId ?? "",
      at: item.at,
      read: item.read
    })
  }

  return true
}

const isStoredId = (id: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) || /^[0-9a-f-]{36}$/i.test(id)

export const saveRequest = async (item: RequestRecord) => {
  const client = getBlocksClient()
  if (!client) return item
  const api = client.data.collection("Request")
  if (!isStoredId(item.id)) {
    const created = await api.create(requestToRow(item)) as { itemId?: string; data?: { itemId?: string } }
    const id = created.itemId ?? created.data?.itemId
    return id ? { ...item, id } : item
  }
  await api.update(item.id, requestToRow(item))
  return item
}

export const saveNotice = async (item: Notice) => {
  const client = getBlocksClient()
  if (!client) return
  await client.data.collection("Notice").create({
    role: item.role,
    title: item.title,
    body: item.body,
    requestId: item.requestId ?? "",
    at: item.at,
    read: item.read
  })
}

export const markNoticeReadRemote = async (id: string) => {
  const client = getBlocksClient()
  if (!client || id.startsWith("n-")) return
  await client.data.collection("Notice").update(id, { read: true })
}
