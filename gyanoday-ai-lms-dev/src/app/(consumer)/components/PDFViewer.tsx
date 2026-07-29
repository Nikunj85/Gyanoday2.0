'use client'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { BookOpen, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

import { cn } from '@/lib/utils'
import { Chapter } from '@/types'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  chapter: Chapter | null
  themeColor: string
  hasChapters?: boolean
}

export function PDFViewer({ chapter, themeColor, hasChapters = true }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  const observerRef = useRef<ResizeObserver | null>(null)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (node) {
      // Set initial width immediately
      setContainerWidth(node.clientWidth)

      observerRef.current = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) {
          // contentRect.width sometimes differs from clientWidth regarding scrollbars
          // clientWidth is usually safer for "available space" inside the element
          setContainerWidth((entry.target as HTMLElement).clientWidth)
        }
      })
      observerRef.current.observe(node)
    }
  }, [])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error)
    setIsLoading(false)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))
  const handleResetZoom = () => setZoom(100)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom Controls
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault()
          handleZoomIn()
        } else if (e.key === '-') {
          e.preventDefault()
          handleZoomOut()
        } else if (e.key === '0') {
          e.preventDefault()
          handleResetZoom()
        }
      }

      // Security: Disable Ctrl+S (Save), Ctrl+U (View Source), Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && ['s', 'u', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        return false
      }

      // Security: Disable F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault()
        return false
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    setNumPages(null)
    setZoom(100)
  }, [chapter?.id, chapter?.pdf_url])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target

    // Prevent division by zero
    if (scrollHeight <= clientHeight) {
      target.style.setProperty('--scroll-progress', '100%')
      return
    }

    // Match CSS min-height for scrollbar thumb (defined in globals.css)
    const MIN_THUMB_HEIGHT = 40

    // Calculate probable thumb height
    // The browser calculates thumb height as: clientHeight * (clientHeight / scrollHeight)
    // But clamps it to min-height
    const calculatedThumbHeight = Math.max(
      MIN_THUMB_HEIGHT,
      clientHeight * (clientHeight / scrollHeight)
    )

    // Calculate available scrollable track space
    const availableTrackSpace = clientHeight - calculatedThumbHeight
    const scrollRange = scrollHeight - clientHeight

    // Calculate thumb position from top of viewport
    const scrollRatio = scrollTop / scrollRange
    const thumbTop = scrollRatio * availableTrackSpace

    // Calculate center of thumb relative to viewport height for the gradient stop
    const thumbCenter = thumbTop + calculatedThumbHeight / 2
    const progressPercent = thumbCenter / clientHeight

    target.style.setProperty('--scroll-progress', `${progressPercent * 100}%`)
  }

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-neutral-50 dark:bg-neutral-900 rounded-[40px] border-2 border-dashed border-neutral-200 dark:border-neutral-800 p-12 text-center transition-colors duration-300">
        <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6 text-neutral-400 transition-colors duration-300">
          <BookOpen size={48} />
        </div>
        <h3 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2 transition-colors duration-300">
          {hasChapters ? 'Select a Chapter' : 'No chapters uploaded'}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-xs transition-colors duration-300">
          {hasChapters
            ? 'Choose a chapter from the list on the left to start learning.'
            : 'Chapters are not available yet. Please check back later.'}
        </p>
      </div>
    )
  }

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'flex flex-col w-full transition-all duration-500 select-none',
        isFullscreen
          ? 'fixed inset-0 z-[200] bg-white dark:bg-neutral-950'
          : 'relative rounded-[32px] overflow-hidden bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-100 dark:border-neutral-800'
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-50 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            <BookOpen size={20} />
          </div>
          <h4 className="font-bold text-neutral-800 dark:text-neutral-100 leading-tight text-sm md:text-base line-clamp-2">
            {chapter.title}
          </h4>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Zoom Controls */}
          <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-xl p-1">
            <button
              onClick={handleZoomOut}
              className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-neutral-700 rounded-lg text-neutral-500 transition-all active:scale-90"
              title="Zoom Out"
              disabled={zoom <= 50}
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-[10px] md:text-xs font-bold text-neutral-600 dark:text-neutral-400 min-w-[35px] md:min-w-[45px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-neutral-700 rounded-lg text-neutral-500 transition-all active:scale-90"
              title="Zoom In"
              disabled={zoom >= 300}
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-600 mx-1" />
            <button
              onClick={handleResetZoom}
              className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-neutral-700 rounded-lg text-neutral-500 transition-all active:scale-90"
              title="Reset Zoom"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-neutral-500 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 relative min-h-[900px] lg:h-[calc(100vh-120px)] lg:min-h-[1000px] bg-white dark:bg-neutral-900 w-full">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm transition-opacity duration-300">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full border-4 border-neutral-100 dark:border-neutral-800 border-t-primary animate-spin"
                style={{ borderTopColor: themeColor }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen size={24} className="text-neutral-200 dark:text-neutral-700" />
              </div>
            </div>
            <p className="mt-4 text-sm font-bold text-neutral-500 animate-pulse uppercase tracking-widest">
              Loading Content...
            </p>
          </div>
        )}

        {chapter.pdf_url ? (
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full overflow-auto flex justify-center bg-neutral-100 dark:bg-neutral-950 custom-scrollbar-pdf"
            style={
              {
                '--scrollbar-color': themeColor,
                '--scrollbar-bg': `${themeColor}33`, // ~20% opacity
                '--scrollbar-hover': `${themeColor}`,
                '--scroll-progress': '0%',
              } as React.CSSProperties
            }
          >
            <Document
              file={chapter.pdf_url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              className="flex flex-col gap-4 w-full"
            >
              {numPages &&
                containerWidth > 0 &&
                Array.from(new Array(numPages), (el, index) => (
                  <Page
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={containerWidth ? containerWidth * (zoom / 100) : undefined}
                    className="shadow-xl mx-auto"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                ))}
            </Document>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-white dark:bg-neutral-900">
            <p className="text-neutral-500 font-medium">
              No PDF content available for this chapter.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
