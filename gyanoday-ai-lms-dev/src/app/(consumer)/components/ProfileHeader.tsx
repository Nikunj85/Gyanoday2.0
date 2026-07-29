'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'

interface ProfileHeaderProps {
  user: any
  initials: string
  isEditing: boolean
  onEditClick: () => void
}

export function ProfileHeader({ user, initials, isEditing, onEditClick }: ProfileHeaderProps) {
  const { t } = useTranslation()

  return (
    <section className="relative mt-0 md:mt-0 h-[8vh] md:h-[8vh] bg-lavender-mist dark:bg-neutral-900 transition-colors duration-300 z-10">
      {/* Decorative Assets */}
      <div className="absolute top-2 right-4 md:right-0 pointer-events-none z-30 scale-[0.6] md:scale-75 origin-top-right translate-y-4 hidden sm:block">
        <Image
          src="/snake1.png"
          alt="Decoration"
          width={150}
          height={150}
          className="object-contain"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-40">
        <div className="container mx-auto px-4 flex items-center justify-between md:justify-center gap-4 md:gap-8 lg:gap-12">
          {/* Avatar Section */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#FCE8D3] dark:bg-neutral-800 rounded-full flex items-center justify-center text-philosophy dark:text-lavender-mist text-lg md:text-2xl font-black shadow-xl transition-colors duration-300">
              {initials}
            </div>

            <div className="flex flex-col">
              <h2 className="text-philosophy dark:text-lavender-mist text-lg md:text-xl font-extrabold tracking-tight leading-tight transition-colors duration-300">
                {user?.name || t('common.profile_page.loading')}
              </h2>
              <p className="text-philosophy/70 dark:text-lavender-mist/70 text-xs md:text-sm font-semibold transition-colors duration-300">
                {user?.email || ''}
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={onEditClick}
              className="bg-primary hover:bg-philosophy/80 cursor-pointer text-white px-3 py-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-lg font-bold text-xs md:text-xs transition-all active:scale-95 shadow-[inset_0px_4px_11.3px_0px_rgba(0,0,0,0.25)] whitespace-nowrap dark:bg-primary-hover dark:hover:bg-primary"
            >
              {t('common.profile_page.edit_profile')}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
