'use client'

import { HTMLMotionProps, motion, Variants } from 'framer-motion'
import { ReactNode } from 'react'

import * as variants from './variants'

type AnimationType = keyof typeof variants

interface MotionWrapperProps extends HTMLMotionProps<'div'> {
  children?: ReactNode
  animation?: AnimationType | Variants
  delay?: number
  duration?: number
  staggerChildren?: number
  delayChildren?: number
  viewportOnce?: boolean
  viewportMargin?: string
  custom?: any
  className?: string
  whileHover?: any
  whileTap?: any
  whileDrag?: any
  whileFocus?: any
}

export const MotionWrapper = ({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration,
  staggerChildren,
  delayChildren,
  viewportOnce = true,
  viewportMargin = '-100px',
  custom,
  ...props
}: MotionWrapperProps) => {
  const selectedVariant =
    typeof animation === 'string' ? (variants[animation] as Variants) : animation

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, margin: viewportMargin }}
      variants={selectedVariant}
      custom={{ delay, duration, staggerChildren, delayChildren, ...custom }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MotionContainer = ({
  children,
  staggerChildren = 0.15,
  delayChildren = 0,
  viewportOnce = true,
  viewportMargin = '-100px',
  ...props
}: MotionWrapperProps) => {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: viewportOnce, margin: viewportMargin }}
      variants={variants.staggerContainer}
      custom={{ staggerChildren, delayChildren }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
