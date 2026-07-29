import { AnimatePresence, motion } from 'framer-motion'
import React from 'react'
import { useTranslation } from 'react-i18next'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface LogoutDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const { t } = useTranslation()

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-3xl border-none p-0 overflow-hidden max-w-[400px] bg-transparent shadow-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 350,
              }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border shadow-2xl"
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-black text-primary dark:text-white text-center">
                  {t('common.profile_page.logout')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-500 dark:text-neutral-400 text-center font-medium text-lg mt-2 leading-relaxed">
                  {t('common.profile_page.logout_desc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                <AlertDialogCancel
                  onClick={onClose}
                  className="flex-1 cursor-pointer rounded-2xl border-none bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold h-12 transition-all active:scale-95 m-0"
                >
                  {t('common.profile_page.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirm}
                  className="flex-1 cursor-pointer rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold h-12 transition-all active:scale-95 border-none m-0"
                >
                  {t('common.profile_page.logout')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </AlertDialogContent>
    </AlertDialog>
  )
}
