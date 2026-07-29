import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Paragraphs
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,

          // Lists
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,

          // Headings
          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mb-1 mt-2">{children}</h3>,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {children}
            </a>
          ),

          // Code blocks
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className?.includes('language-')

            if (isInline) {
              return (
                <code
                  className="bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 text-sm font-mono text-pink-600 dark:text-pink-400"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            return (
              <div className="rounded-lg bg-neutral-900 text-neutral-100 p-3 my-3 overflow-x-auto shadow-sm">
                <code className={cn('text-sm font-mono', className)} {...props}>
                  {children}
                </code>
              </div>
            )
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:text-gray-400 my-2">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {children}
            </td>
          ),

          // Horizontal Rule
          hr: () => <hr className="my-4 border-gray-200 dark:border-gray-700" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
