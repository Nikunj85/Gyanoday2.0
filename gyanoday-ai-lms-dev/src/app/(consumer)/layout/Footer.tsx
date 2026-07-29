'use client'

import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'

export function Footer() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const currentYear = new Date().getFullYear()

  return (
    <div className="w-full bg-background overflow-hidden">
      <MotionWrapper animation="fadeInLeft" duration={1.2} delay={0.2}>
        <img src="/cat.png" alt="Gyanoday mascot" className="w-25 h-25 md:w-32 md:h-30 -mb-2" />
      </MotionWrapper>

      <footer className="bg-shiny-shamrock text-white pt-10 pb-6">
        <div className="container mx-auto px-4 lg:px-20">
          <MotionContainer
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-40 items-start md:mb-6 mb-10 sm:mb-0"
            staggerChildren={0.2}
            delayChildren={0.4}
          >
            {/* Logo & Tagline */}
            <MotionWrapper animation="fadeInUp" duration={1.2} className="space-y-5">
              <h3 className="text-2xl font-semibold">{t('common.footer.gyanoday_ai')}</h3>
              <p className="text-white/90 text-sm leading-relaxed max-w-sm">
                {t('common.footer.tagline')}
              </p>
            </MotionWrapper>

            {/* Contact Info */}
            <MotionWrapper animation="fadeInUp" duration={1.2} className="space-y-5">
              <h3 className="text-xl font-semibold">{t('common.footer.contact_us')}</h3>
              <ul className="space-y-2 text-white/90 text-sm">
                <MotionWrapper animation="fadeInRight" delay={0.1} duration={0.8}>
                  <li>
                    <Link
                      href="mailto:nikunjpoddar85@gmail.com"
                      className="flex items-center space-x-3 transition-transform hover:translate-x-1 text-white/90 hover:text-white"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{t('common.footer.email')}</span>
                    </Link>
                  </li>
                </MotionWrapper>
                <MotionWrapper animation="fadeInRight" delay={0.2} duration={0.8}>
                  <li>
                    <Link
                      href="https://wa.me/919429205342"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 transition-transform hover:translate-x-1 text-white/90 hover:text-white"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{t('common.footer.phone')}</span>
                    </Link>
                  </li>
                </MotionWrapper>
                <MotionWrapper animation="fadeInRight" delay={0.3} duration={0.8}>
                  <li className="flex items-center space-x-3 transition-transform hover:translate-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{t('common.footer.support_time')}</span>
                  </li>
                </MotionWrapper>
                <MotionWrapper animation="fadeInRight" delay={0.4} duration={0.8}>
                  <li className="flex items-center space-x-3 transition-transform hover:translate-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{t('common.footer.location')}</span>
                  </li>
                </MotionWrapper>
              </ul>
            </MotionWrapper>

            {/* Quick Links */}
            <MotionWrapper animation="fadeInUp" duration={1.2} className="space-y-5">
              <h3 className="text-xl font-semibold">{t('common.footer.quick_links')}</h3>
              <ul className="space-y-2 text-sm">
                {[
                  { href: '/', label: t('common.home') },
                  { href: '/about', label: t('common.about_us') },
                  { href: '/contact', label: t('common.footer.contact_us') },
                  { href: '/faq', label: t('common.footer.faq') },
                ].map((link, idx) => {
                  const isActive = pathname === link.href
                  return (
                    <MotionWrapper
                      key={idx}
                      animation="fadeInRight"
                      delay={0.1 * idx}
                      duration={0.8}
                    >
                      <li>
                        {isActive ? (
                          <div className="flex items-center gap-2 text-white font-black cursor-default py-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                            <span>{link.label}</span>
                          </div>
                        ) : (
                          <Link
                            href={link.href}
                            className="text-white/90 hover:text-white hover:underline transition-colors flex items-center group"
                          >
                            <span className="w-0 h-0.5 bg-white transition-all group-hover:w-2 mr-0 group-hover:mr-2" />
                            {link.label}
                          </Link>
                        )}
                      </li>
                    </MotionWrapper>
                  )
                })}
              </ul>
            </MotionWrapper>
          </MotionContainer>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-3 text-center text-[10px] md:text-xs tracking-wider text-white/70 uppercase border-t border-white/30 pt-4">
            <p>© {currentYear} Gyanoday Learning. All Rights Reserved.</p>
            {/*<span className="hidden md:block opacity-30 text-lg font-light">|</span>
            <p className="flex items-center gap-1.5">
              <span>Powered by</span>
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
        </div>
      </footer>
    </div>
  )
}
