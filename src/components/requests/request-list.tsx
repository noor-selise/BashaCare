import { motion } from "framer-motion"
import { staggerContainer } from "@/lib/motion"
import { cn } from "@/lib/cn"
import type { ReactNode } from "react"

export const RequestList = ({ children, className }: { children: ReactNode; className?: string }) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      {children}
    </motion.div>
  )
}
