import { cn } from "@/lib/cn"
import type { Evidence } from "@/types"

const toneClass = (tone: Evidence["tone"]) => {
  switch (tone) {
    case "lift":
      return "from-[#3d3a34] to-[#8a8376]"
    case "water":
      return "from-[#1a3a48] to-[#4d8aa3]"
    case "pump":
      return "from-[#3a2a18] to-[#8a6a3a]"
    case "other":
      return "from-[#2f3a2f] to-[#6a7a62]"
    default: {
      const _never: never = tone
      return _never
    }
  }
}

export const EvidenceStrip = ({ items }: { items: Evidence[] }) => {
  if (items.length === 0) {
    return <p className="text-sm text-ink-faint">No photo evidence yet.</p>
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="overflow-hidden rounded-md border border-hairline bg-surface">
          <figure>
            <div
              className={cn(
                "flex aspect-[4/3] items-end bg-linear-to-br p-3 text-sm text-surface",
                toneClass(item.tone)
              )}
              role="img"
              aria-label={item.caption}
            >
              <span className="rounded-full bg-black/35 px-2 py-1 text-[11px] uppercase tracking-[0.08em]">
                {item.label}
              </span>
            </div>
            <figcaption className="px-3 py-2 text-sm text-ink-soft">{item.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}
