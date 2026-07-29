'use client'

// import Link from 'next/link'
// import { useTranslation } from 'react-i18next'

export function SimpleFooter() {
  // const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full bg-shiny-shamrock text-white py-4 relative z-20">
      <div className="flex flex-col md:flex-row justify-center items-center gap-1 md:gap-2 text-center text-xs text-white/90">
        <p>© {currentYear} Gyanoday Learning. All Rights Reserved.</p>
        {/* <span className="hidden md:inline">|</span>
        <p>
          Powered by{' '}
          <Link
            href="https://probietech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white hover:text-white transition-all relative group"
          >
            Probietech
            <span className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-white/30 group-hover:bg-white transition-all" />
          </Link>
        </p> */}
      </div>
    </footer>
  )
}
