import { Variants } from 'framer-motion'

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: { delay?: number; duration?: number } = {}) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom.duration || 1.0,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: (custom: { delay?: number; duration?: number } = {}) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: custom.duration || 1.0,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: (custom: { delay?: number; duration?: number } = {}) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom.duration || 1.2,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: (custom: { delay?: number; duration?: number } = {}) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: custom.duration || 1.2,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom: { delay?: number; duration?: number } = {}) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: custom.duration || 1.0,
      delay: custom.delay || 0,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: (custom: { staggerChildren?: number; delayChildren?: number } = {}) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.staggerChildren || 0.25,
      delayChildren: custom.delayChildren || 0,
    },
  }),
}

export const springUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (custom: { delay?: number; stiffness?: number; damping?: number } = {}) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: custom.stiffness || 80,
      damping: custom.damping || 20,
      delay: custom.delay || 0,
    },
  }),
}

export const springScale: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (custom: { delay?: number; stiffness?: number; damping?: number } = {}) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: custom.stiffness || 120,
      damping: custom.damping || 15,
      delay: custom.delay || 0,
    },
  }),
}

export const hoverLift = {
  y: -8,
  transition: { duration: 0.3 },
}

export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.2 },
}
