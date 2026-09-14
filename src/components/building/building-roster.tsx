"use client"

import { motion } from "framer-motion"
import { EmptyState } from "@/components/ui/empty-state"
import { buildingFactsForRole } from "@/features/building/roster"
import { formatTaka } from "@/lib/money"
import { fadeRise, staggerContainer } from "@/lib/motion"
import type { BuildingInfo, Flat, Role } from "@/types"

const headingFor = (role: Role) => {
  switch (role) {
    case "resident":
      return "Your flat"
    case "vendor":
      return "Flats on your jobs"
    case "staff":
    case "committee":
    case "admin":
      return "Flats"
    default: {
      const _never: never = role
      return _never
    }
  }
}

const emptyCopy = (role: Role) => {
  switch (role) {
    case "resident":
      return {
        title: "No flat assigned",
        body: "Ask the committee to register your unit."
      }
    case "vendor":
      return {
        title: "No flats on your jobs",
        body: "When a job is assigned, the unit appears here."
      }
    case "staff":
    case "committee":
    case "admin":
      return {
        title: "No flats yet",
        body: "Register units on Registration."
      }
    default: {
      const _never: never = role
      return _never
    }
  }
}

const occupancyLabel = (status: Flat["status"]) => {
  switch (status) {
    case "occupied":
      return "Occupied"
    case "vacant":
      return "Vacant"
    default: {
      const _never: never = status
      return _never
    }
  }
}

export const BuildingRoster = ({
  role,
  buildingInfo,
  flats
}: {
  role: Role
  buildingInfo: BuildingInfo | null
  flats: Flat[]
}) => {
  const facts = buildingFactsForRole(role)
  const empty = emptyCopy(role)

  return (
    <section className="border border-hairline bg-surface p-4 md:p-6">
      <h2 className="font-display text-xl">{headingFor(role)}</h2>
      {buildingInfo ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {facts.name ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Building</dt>
              <dd className="mt-1">{buildingInfo.name}</dd>
            </div>
          ) : null}
          {facts.address ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Address</dt>
              <dd className="mt-1">{buildingInfo.addressLine}</dd>
            </div>
          ) : null}
          {facts.storeys ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Storeys</dt>
              <dd className="mt-1 font-mono">{buildingInfo.storeys}</dd>
            </div>
          ) : null}
          {facts.registeredCount ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Registered flats</dt>
              <dd className="mt-1 font-mono">{flats.length}</dd>
            </div>
          ) : null}
          {facts.fee ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Fee</dt>
              <dd className="mt-1 font-mono">{formatTaka(buildingInfo.fee)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      {flats.length === 0 ? (
        <div className="mt-4">
          <EmptyState title={empty.title} body={empty.body} />
        </div>
      ) : (
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-4 space-y-2"
        >
          {flats.map((flat) => (
            <motion.li
              key={flat.id}
              variants={fadeRise}
              className="flex items-center justify-between gap-3 border border-hairline bg-surface-2 px-3 py-2 text-sm"
            >
              <span>{flat.label}</span>
              <span className="text-ink-faint">
                Floor {flat.floor} · {occupancyLabel(flat.status)}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  )
}
