'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

export default function TestMcqPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const pdfUrl =
    'https://npmomrpouglubqducpsq.supabase.co/storage/v1/object/public/chapter-pdfs/gujarati/Gujarati--1.pdf'
  const language = 'GU'

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      setResult({})
    } catch (err: any) {
      setError(err.message || 'Failed to generate MCQs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            MCQ Generation Test
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400 sm:mt-4">
            Test the AI-powered MCQ generation for Gujarat Board chapters.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 mb-8 transition-all hover:shadow-2xl">
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  PDF URL (Fixed)
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 text-xs">
                    URL
                  </span>
                  <code className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                    {pdfUrl}
                  </code>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 text-xs">
                    Code
                  </span>
                  <code className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-xs font-mono text-gray-600 dark:text-gray-400">
                    {language}
                  </code>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                size="lg"
                className="px-10 py-6 text-lg font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-indigo-500/30"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  'Generate 5 MCQs Now'
                )}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 mb-8 border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error generating MCQs
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Generated Content
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Success
              </span>
            </div>
            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
              <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="ml-4 text-xs font-mono text-gray-400">mcq-response.json</span>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-xs font-mono text-indigo-300 leading-relaxed">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
