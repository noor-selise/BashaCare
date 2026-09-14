import { seedBuildingInfo, seedDecisions, seedFlats, seedNotices, seedPeople, seedRequests } from "@/data/seed"
import { vendors as directoryVendors } from "@/data/directory"
import { getBlocksClient } from "@/lib/blocks/client"
import type { BuildingInfo, Decision, Flat, Notice, Person, RequestRecord, Vendor } from "@/types"

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

type BuildingRow = Record<string, unknown> & {
  itemId?: string
  ItemId?: string
  name?: string
  addressLine?: string
  storeys?: number
  flatCount?: number
  fee?: number
}

const buildingFromRow = (row: BuildingRow): BuildingInfo => ({
  id: rowId(row),
  name: String(row.name ?? ""),
  addressLine: String(row.addressLine ?? ""),
  storeys: typeof row.storeys === "number" ? row.storeys : 0,
  flatCount: typeof row.flatCount === "number" ? row.flatCount : 0,
  fee: typeof row.fee === "number" ? row.fee : 0
})

const buildingToRow = (item: Omit<BuildingInfo, "id">) => ({
  name: item.name,
  addressLine: item.addressLine,
  storeys: item.storeys,
  flatCount: item.flatCount,
  fee: item.fee
})

type FlatRow = Record<string, unknown> & {
  itemId?: string
  ItemId?: string
  label?: string
  floor?: number
  status?: Flat["status"]
}

const flatFromRow = (row: FlatRow): Flat => ({
  id: String(row.label ?? rowId(row)),
  label: String(row.label ?? ""),
  floor: typeof row.floor === "number" ? row.floor : 0,
  status: (row.status ?? "occupied") as Flat["status"]
})

type PersonRow = Record<string, unknown> & {
  itemId?: string
  ItemId?: string
  email?: string
  name?: string
  title?: string
  flatId?: string
  vendorId?: string
}

const personFromRow = (row: PersonRow): Person => ({
  id: String(row.email ?? rowId(row)),
  email: String(row.email ?? ""),
  name: String(row.name ?? ""),
  title: String(row.title ?? ""),
  flatId: row.flatId ? String(row.flatId) : undefined,
  vendorId: row.vendorId ? String(row.vendorId) : undefined
})

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
    return {
      requests: [] as RequestRecord[],
      decisions: [] as Decision[],
      notices: [] as Notice[],
      vendors: directoryVendors,
      flats: seedFlats,
      people: seedPeople,
      buildingInfo: seedBuildingInfo
    }
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
  const buildingApi = client.data.collection<BuildingRow>("Building", {
    fields: ["name", "addressLine", "storeys", "flatCount", "fee"]
  })
  const flatsApi = client.data.collection<FlatRow>("Flat", {
    fields: ["label", "floor", "status"]
  })
  const peopleApi = client.data.collection<PersonRow>("Person", {
    fields: ["email", "name", "title", "flatId", "vendorId"]
  })

  const [requestRes, decisionRes, noticeRes, vendorRes, buildingRes, flatRes, personRes] = await Promise.all([
    requestsApi.list({ pageNo: 1, pageSize: 100 }),
    decisionsApi.list({ pageNo: 1, pageSize: 50 }),
    noticesApi.list({ pageNo: 1, pageSize: 50 }),
    vendorsApi.list({ pageNo: 1, pageSize: 20 }),
    buildingApi.list({ pageNo: 1, pageSize: 1 }),
    flatsApi.list({ pageNo: 1, pageSize: 100 }),
    peopleApi.list({ pageNo: 1, pageSize: 200 })
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

  const buildingRows = listItems<BuildingRow>(buildingRes, "getBuildings")
  const buildingInfo = buildingRows.length ? buildingFromRow(buildingRows[0]) : seedBuildingInfo

  const flatRows = listItems<FlatRow>(flatRes, "getFlats")
  const flats = flatRows.length ? flatRows.map(flatFromRow) : seedFlats

  const personRows = listItems<PersonRow>(personRes, "getPersons")
  const people = personRows.length ? personRows.map(personFromRow) : seedPeople

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
    vendors,
    flats,
    people,
    buildingInfo
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
  const buildingApi = client.data.collection("Building")
  const flatsApi = client.data.collection("Flat")
  const peopleApi = client.data.collection("Person")

  for (const vendor of directoryVendors) {
    await vendorsApi.create({ name: vendor.name, trade: vendor.trade })
  }

  await buildingApi.create(buildingToRow(seedBuildingInfo))

  for (const flat of seedFlats) {
    await flatsApi.create({ label: flat.label, floor: flat.floor, status: flat.status })
  }

  for (const person of seedPeople) {
    await peopleApi.create({
      email: person.email,
      name: person.name,
      title: person.title,
      flatId: person.flatId ?? "",
      vendorId: person.vendorId ?? ""
    })
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

export const addFlat = async (input: { label: string; floor: number }): Promise<Flat> => {
  const flat: Flat = { id: input.label, label: input.label, floor: input.floor, status: "occupied" }
  const client = getBlocksClient()
  if (!client) return flat
  await client.data.collection("Flat").create({ label: input.label, floor: input.floor, status: "occupied" })
  return flat
}

export const saveBuildingInfo = async (
  input: Omit<BuildingInfo, "id">,
  existingId?: string
): Promise<BuildingInfo> => {
  const client = getBlocksClient()
  if (!client) return { ...input, id: existingId }
  const api = client.data.collection("Building")
  if (existingId) {
    await api.update(existingId, buildingToRow(input))
    return { ...input, id: existingId }
  }
  const created = (await api.create(buildingToRow(input))) as { itemId?: string; data?: { itemId?: string } }
  return { ...input, id: created.itemId ?? created.data?.itemId }
}

export const savePerson = async (input: Omit<Person, "id">): Promise<Person> => {
  const person: Person = { ...input, id: input.email }
  const client = getBlocksClient()
  if (!client) return person
  await client.data.collection("Person").create({
    email: input.email,
    name: input.name,
    title: input.title,
    flatId: input.flatId ?? "",
    vendorId: input.vendorId ?? ""
  })
  return person
}
