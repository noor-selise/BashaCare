import { findPerson } from "@/data/directory"
import { formatWhen } from "@/lib/format"
import type { Person, RequestRecord } from "@/types"

export const RequestContext = ({
  request,
  people
}: {
  request: RequestRecord
  people: Person[]
}) => {
  const resident = findPerson(request.residentId, people)

  return (
    <dl className="grid gap-3 border border-hairline bg-surface-2 p-4 sm:grid-cols-3">
      <div>
        <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Requested by</dt>
        <dd className="mt-1 text-ink">{resident.name}</dd>
        <dd className="text-sm text-ink-soft">{resident.title}</dd>
      </div>
      <div>
        <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Flat</dt>
        <dd className="mt-1 font-mono">{request.flatId}</dd>
      </div>
      <div>
        <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">Submitted</dt>
        <dd className="mt-1 text-ink-soft">{formatWhen(request.createdAt)}</dd>
      </div>
    </dl>
  )
}
