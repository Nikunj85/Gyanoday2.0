'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { useLanguage } from '@/providers/language-provider'
import { StreakRule } from '@/types'
import { Language } from '@/types/users'

import timer from '../../../../public/timer.png'

interface StreakInfoModalProps {
  isOpen: boolean
  onClose: () => void
  rules?: StreakRule[]
}

export function StreakInfoModal({ isOpen, onClose, rules }: StreakInfoModalProps) {
  const { language } = useLanguage()
  const { t } = useTranslation()
  const userLang = language || Language.EN

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm shadow-inner"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/50">
              <h4 className="text-xl font-bold text-neutral-900 dark:text-white">
                {t('common.student_dashboard.streak_info_modal.title', "7day's strike")}
              </h4>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-50"
                aria-label="Close modal"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto no-scrollbar">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-medium">
                {t('common.student_dashboard.streak_info_modal.description', "7day's strike")}
              </p>

              <div className="space-y-4">
                {rules?.map((rule, idx) => (
                  <motion.div
                    key={rule.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50 transition-all duration-300"
                  >
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 p-2 shadow-sm"
                      style={{ backgroundColor: `${rule.color}15` }}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={rule.gif}
                          alt={rule.emoji_name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h5
                        className="text-base font-bold capitalize mb-0.5"
                        style={{ color: rule.color }}
                      >
                        {typeof rule.label === 'string'
                          ? rule.label
                          : rule.label[userLang] ||
                            rule.label[Language.EN] ||
                            rule.emoji_name.replace('_', ' ')}
                      </h5>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {typeof rule.meaning === 'string'
                          ? rule.meaning
                          : rule.meaning[userLang] || rule.meaning[Language.EN]}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Future Days explanation */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (rules?.length || 0) * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 opacity-70"
                >
                  <div className="w-16 h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                    <div className="relative w-8 h-8 shrink-0">
                      <Image
                        src={timer || '/timer.png'}
                        alt="upcoming"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="text-base font-bold text-neutral-400 capitalize mb-0.5">
                      {t('common.student_dashboard.streak_info_modal.future_days', 'Future Days')}
                    </h5>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                      {t(
                        'common.student_dashboard.streak_info_modal.future_days_description',
                        'Upcoming days of the week. Time to shine!'
                      )}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-neutral-50 dark:bg-neutral-800/30 text-center">
              <button
                onClick={onClose}
                className="w-full py-3 px-6 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95 cursor-pointer"
              >
                {t('common.student_dashboard.streak_info_modal.got_it', 'Got it!')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
