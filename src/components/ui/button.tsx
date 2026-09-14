import { motion, type HTMLMotionProps } from "framer-motion"
import { DURATION, EASE_STANDARD } from "@/lib/motion"
import { cn } from "@/lib/cn"

type ButtonProps = HTMLMotionProps<"button"> & {
  variant?: "primary" | "ghost" | "danger" | "quiet"
}

export const Button = ({
  variant = "primary",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) => {
  const styles = {
    primary: "bg-courtyard text-surface hover:bg-courtyard-hover shadow-[0_1px_0_rgba(28,25,21,0.08)]",
    ghost: "border border-hairline bg-surface text-ink hover:bg-warm",
    danger: "bg-terracotta text-surface hover:opacity-90",
    quiet: "text-ink-soft underline-offset-4 hover:underline"
  }[variant]

  const liftable = variant === "primary" || variant === "danger"

  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      whileHover={liftable ? { y: -1 } : undefined}
      transition={{ duration: DURATION.control, ease: EASE_STANDARD }}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-[8px] px-4 text-[16px] font-medium transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-courtyard",
        "disabled:cursor-not-allowed disabled:opacity-50",
        styles,
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
