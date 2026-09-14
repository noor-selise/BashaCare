export const EASE_STANDARD = [0.22, 1, 0.36, 1] as const

export const DURATION = {
  control: 0.15,
  panel: 0.28,
  reveal: 0.45
} as const

export const fadeRise = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.panel, ease: EASE_STANDARD }
  }
}

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 }
  }
}

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: DURATION.reveal, ease: EASE_STANDARD }
}
