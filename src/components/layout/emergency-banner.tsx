"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { useBuilding, useSessionActor } from "@/lib/store"

export const EmergencyBanner = () => {
  const { requests } = useBuilding()
  const actor = useSessionActor()
  const reduceMotion = useReducedMotion()
  if (!actor || actor.role === "resident") return null

  const open = requests.filter((item) => {
    const visible = actor.role !== "vendor" || item.vendorId === actor.vendorId
    return (
      visible &&
      item.urgency === "emergency" &&
      item.status !== "verified_closed" &&
      item.status !== "rejected"
    )
  })

  if (open.length === 0) return null

  const first = open[0]
  const href = actor.role === "vendor"
    ? `/vendor/jobs/${first.id}`
    : actor.role === "committee"
      ? "/committee"
      : `/staff/requests/${first.id}`

  return (
    <motion.div
      className="bg-terracotta-wash text-terracotta-deep"
      animate={
        reduceMotion
          ? undefined
          : { opacity: [1, 0.85, 1], transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }
      }
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-display text-lg">
          {open.length} emergency {open.length === 1 ? "incident" : "incidents"} open
        </p>
        <Link
          href={href}
          className="inline-flex min-h-11 items-center font-medium underline underline-offset-4"
        >
          Flat {first.flatId} — open first
        </Link>
      </div>
    </motion.div>
  )
}
