import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { fadeRise } from "@/lib/motion"

type EmptyStateProps = {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState = ({ title, body, actionLabel, onAction }: EmptyStateProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeRise}
      role="status"
      className="border border-dashed border-hairline px-5 py-10 text-center"
    >
      <h3 className="font-display text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">{body}</p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  )
}
