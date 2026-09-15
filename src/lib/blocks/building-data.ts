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
  staffAssigneeId?: string
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
    staffAssigneeId: row.staffAssigneeId ? String(row.staffAssigneeId) : undefined,
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
    staffAssigneeId: item.staffAssigneeId ?? "",
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
  photoFileId?: string
  photoMimeType?: string
}

const personFromRow = (row: PersonRow): Person => ({
  id: String(row.email ?? rowId(row)),
  email: String(row.email ?? ""),
  name: String(row.name ?? ""),
  title: String(row.title ?? ""),
  flatId: row.flatId ? String(row.flatId) : undefined,
  vendorId: row.vendorId ? String(row.vendorId) : undefined,
  photoFileId: row.photoFileId ? String(row.photoFileId) : undefined,
  photoMimeType: row.photoMimeType ? String(row.photoMimeType) : undefined
})

const listItems = <T,>(response: unknown, key: string): T[] => {
  const record = response as {
    data?: Record<string, { items?: T[] }>
    items?: T[]
  }
  return record.data?.[key]?.items ?? record.items ?? []
}

// Blocks Data's `isUniqueData` schema flag is not a server-enforced constraint — concurrent
// or repeated writes (e.g. the admin seed race below) can leave multiple live rows sharing the
// same label/email. Collapse those to one row per key before they reach the UI, since every
// consumer derives an app-level id from that key and duplicates would collide as React keys.
const dedupeByKey = <T,>(items: T[], keyOf: (item: T) => string): T[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyOf(item).toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

type MutationEnvelope = {
  data?: Record<string, { acknowledged?: boolean; itemId?: string; message?: string } | undefined>
  errors?: { message?: string }[]
}

// Blocks Data runs collection writes as a GraphQL mutation named `insert|update|delete{Schema}`
// and returns the raw envelope, so the created row's id lives at data.insert{Schema}.itemId.
const createdItemId = (response: unknown, mutationField: string): string | undefined => {
  const record = response as { data?: Record<string, { itemId?: string } | undefined> }
  const itemId = record.data?.[mutationField]?.itemId
  return typeof itemId === "string" && itemId ? itemId : undefined
}

// GraphQL-level failures (unique-constraint violations, rule denials) come back as HTTP 200
// with an `errors[]` body, so the SDK never throws for them. Surface them as real errors.
const assertMutationOk = (response: unknown, mutationField: string, action: string) => {
  const record = response as MutationEnvelope
  if (record.errors?.length) {
    const detail = record.errors
      .map((item) => item?.message)
      .filter((item): item is string => Boolean(item))
      .join("; ")
    throw new Error(`${action} failed: ${detail || "Blocks Data rejected the write."}`)
  }
  const result = record.data?.[mutationField]
  if (result && result.acknowledged !== true) {
    throw new Error(`${action} failed: ${result.message || "Blocks Data did not acknowledge the write."}`)
  }
  return response
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
      "staffAssigneeId",
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
    fields: ["role", "title", "body", "requestId", "recipientId", "at", "read"]
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
    fields: ["email", "name", "title", "flatId", "vendorId", "photoFileId", "photoMimeType"]
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

  // Seed rows are a durable baseline, not an "empty collection" placeholder: merge them in
  // behind the live rows so one real registration never collapses the demo roster.
  const flatRows = listItems<FlatRow>(flatRes, "getFlats")
  const liveFlats = dedupeByKey(flatRows.map(flatFromRow), (item) => item.label)
  const liveFlatLabels = new Set(liveFlats.map((item) => item.label.toLowerCase()))
  const flats = [...liveFlats, ...seedFlats.filter((item) => !liveFlatLabels.has(item.label.toLowerCase()))]

  const personRows = listItems<PersonRow>(personRes, "getPersons")
  const livePeople = dedupeByKey(personRows.map(personFromRow), (item) => item.email)
  const livePersonEmails = new Set(livePeople.map((item) => item.email.toLowerCase()))
  const people = [...livePeople, ...seedPeople.filter((item) => !livePersonEmails.has(item.email.toLowerCase()))]

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
      recipientId: row.recipientId ? String(row.recipientId) : undefined,
      at: String(row.at ?? ""),
      read: Boolean(row.read)
    })),
    vendors,
    flats,
    people,
    buildingInfo
  }
}

const hasRows = async (list: () => Promise<unknown>, key: string) => {
  return listItems(await list(), key).length > 0
}

export const seedBuildingRecords = async () => {
  const client = getBlocksClient()
  if (!client) return false

  const requestsApi = client.data.collection("Request")
  const vendorsApi = client.data.collection("Vendor")
  const decisionsApi = client.data.collection("Decision")
  const noticesApi = client.data.collection("Notice")
  const buildingApi = client.data.collection("Building")
  const flatsApi = client.data.collection("Flat")
  const peopleApi = client.data.collection("Person")

  // Seeding is per-collection: a tenant that already has Requests from an earlier deploy
  // still needs Building/Flat/Person back-filled, otherwise those collections stay empty
  // forever and every persona resolves to the "Desk / System" placeholder.
  const [hasVendors, hasBuilding, hasFlats, hasPeople, hasRequests, hasDecisions, hasNotices] =
    await Promise.all([
      hasRows(() => vendorsApi.list({ pageNo: 1, pageSize: 1 }), "getVendors"),
      hasRows(() => buildingApi.list({ pageNo: 1, pageSize: 1 }), "getBuildings"),
      hasRows(() => flatsApi.list({ pageNo: 1, pageSize: 1 }), "getFlats"),
      hasRows(() => peopleApi.list({ pageNo: 1, pageSize: 1 }), "getPersons"),
      hasRows(() => requestsApi.list({ pageNo: 1, pageSize: 1 }), "getRequests"),
      hasRows(() => decisionsApi.list({ pageNo: 1, pageSize: 1 }), "getDecisions"),
      hasRows(() => noticesApi.list({ pageNo: 1, pageSize: 1 }), "getNotices")
    ])

  let seeded = false

  if (!hasVendors) {
    for (const vendor of directoryVendors) {
      await vendorsApi.create({ name: vendor.name, trade: vendor.trade })
    }
    seeded = true
  }

  if (!hasBuilding) {
    await buildingApi.create(buildingToRow(seedBuildingInfo))
    seeded = true
  }

  if (!hasFlats) {
    for (const flat of seedFlats) {
      await flatsApi.create({ label: flat.label, floor: flat.floor, status: flat.status })
    }
    seeded = true
  }

  if (!hasPeople) {
    for (const person of seedPeople) {
      await peopleApi.create({
        email: person.email,
        name: person.name,
        title: person.title,
        flatId: person.flatId ?? "",
        vendorId: person.vendorId ?? ""
      })
    }
    seeded = true
  }

  if (!hasRequests) {
    for (const item of seedRequests) {
      await requestsApi.create(requestToRow(item))
    }
    seeded = true
  }

  if (!hasDecisions) {
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
    seeded = true
  }

  if (!hasNotices) {
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
    seeded = true
  }

  return seeded
}

const isStoredId = (id: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id) || /^[0-9a-f-]{36}$/i.test(id)

export const saveRequest = async (item: RequestRecord) => {
  const client = getBlocksClient()
  if (!client) return item
  const api = client.data.collection("Request")
  if (!isStoredId(item.id)) {
    const created = await api.create(requestToRow(item))
    const id = createdItemId(created, "insertRequest")
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
    recipientId: item.recipientId ?? "",
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
  // Flat ids stay label-derived on purpose: `flatFromRow` and `Person.flatId` both key on the
  // label, so swapping in the server ItemId here would break the resident -> flat join.
  const flat: Flat = { id: input.label, label: input.label, floor: input.floor, status: "occupied" }
  const client = getBlocksClient()
  if (!client) return flat
  const created = await client.data
    .collection("Flat")
    .create({ label: input.label, floor: input.floor, status: "occupied" })
  assertMutationOk(created, "insertFlat", `Adding flat ${input.label}`)
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
    const updated = await api.update(existingId, buildingToRow(input))
    assertMutationOk(updated, "updateBuilding", "Saving the building")
    return { ...input, id: existingId }
  }
  const created = await api.create(buildingToRow(input))
  assertMutationOk(created, "insertBuilding", "Saving the building")
  return { ...input, id: createdItemId(created, "insertBuilding") }
}

export const savePerson = async (input: Omit<Person, "id">): Promise<Person> => {
  // Person ids are the email, and the email is the join key to IAM — normalise the case once
  // here so a differently-cased invite never strands the account on login.
  const email = input.email.trim().toLowerCase()
  const person: Person = { ...input, email, id: email }
  const client = getBlocksClient()
  if (!client) return person
  const created = await client.data.collection("Person").create({
    email,
    name: input.name,
    title: input.title,
    flatId: input.flatId ?? "",
    vendorId: input.vendorId ?? "",
    photoFileId: input.photoFileId ?? "",
    photoMimeType: input.photoMimeType ?? ""
  })
  assertMutationOk(created, "insertPerson", `Inviting ${email}`)
  return person
}

export const updatePersonProfile = async (
  email: string,
  patch: Pick<Person, "name" | "title" | "photoFileId" | "photoMimeType">,
  existing?: Person
): Promise<Person> => {
  const normalized = email.trim().toLowerCase()
  const person: Person = {
    id: normalized,
    email: normalized,
    name: patch.name.trim(),
    title: patch.title.trim(),
    flatId: existing?.flatId,
    vendorId: existing?.vendorId,
    photoFileId: patch.photoFileId ?? existing?.photoFileId,
    photoMimeType: patch.photoMimeType ?? existing?.photoMimeType
  }
  const client = getBlocksClient()
  if (!client) return person

  const api = client.data.collection<PersonRow>("Person")
  const list = await api.list({ pageNo: 1, pageSize: 200 })
  const rows = listItems<PersonRow>(list, "getPersons")
  const row = rows.find((item) => String(item.email ?? "").toLowerCase() === normalized)
  const payload = {
    email: normalized,
    name: person.name,
    title: person.title,
    flatId: row?.flatId ?? existing?.flatId ?? "",
    vendorId: row?.vendorId ?? existing?.vendorId ?? "",
    photoFileId: person.photoFileId ?? row?.photoFileId ?? "",
    photoMimeType: person.photoMimeType ?? row?.photoMimeType ?? ""
  }

  if (row) {
    const updated = await api.update(rowId(row), payload)
    assertMutationOk(updated, "updatePerson", "Updating profile")
    return person
  }

  const created = await api.create(payload)
  assertMutationOk(created, "insertPerson", "Saving profile")
  return person
}

export const addVendor = async (input: { name: string; trade: string }): Promise<Vendor> => {
  const client = getBlocksClient()
  const slug = input.name.toLowerCase().replace(/\s+/g, "-")
  if (!client) return { id: slug, name: input.name, trade: input.trade }
  const created = await client.data.collection("Vendor").create({ name: input.name, trade: input.trade })
  assertMutationOk(created, "insertVendor", `Adding vendor ${input.name}`)
  // `loadBuildingRecords` assigns the server ItemId to any vendor outside the hardcoded
  // directory, so return that same id here — a local slug would not survive a reload.
  return { id: createdItemId(created, "insertVendor") ?? slug, name: input.name, trade: input.trade }
}
