'use client'

import { useEffect, useState } from 'react'

interface StreakEmojiProps {
  /** Animated GIF / image URL configured for the streak rule (may be blocked or dead). */
  gif?: string
  /** Plain unicode emoji of the rule - always renders, used when the image cannot load. */
  emoji?: string
  alt: string
}

/**
 * Renders the streak rule image and falls back to the rule's unicode emoji whenever the
 * image URL is empty, blocked (hotlink protection / CSP / offline) or returns an error.
 */
export function StreakEmoji({ gif, emoji, alt }: StreakEmojiProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [gif])

  if (gif && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={gif}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    )
  }

  if (emoji) {
    return (
      <span
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center text-[2rem] leading-none sm:text-[2.25rem] 2xl:text-[2.75rem]"
      >
        {emoji}
      </span>
    )
  }

  return null
}
