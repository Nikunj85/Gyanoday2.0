'use client'

import { FileText, FileUp, Loader2, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (file: File) => Promise<string>
  onRemove: () => void
  value?: string
  accept?: Record<string, string[]>
  maxSize?: number
}

export function FileUpload({
  onUpload,
  onRemove,
  value,
  accept = { 'application/pdf': ['.pdf'] },
  maxSize = 5000 * 1024 * 1024, // 5GB (Effectively unlimited for PDFs)
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setIsUploading(true)
      try {
        await onUpload(file)
      } catch (error) {
        console.error('Upload failed:', error)
      } finally {
        setIsUploading(false)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  })

  // Handle file rejections (e.g. wrong type or too large)
  const rejectionError = fileRejections[0]?.errors[0]
  let rejectionMessage = ''
  if (rejectionError?.code === 'file-too-large') rejectionMessage = 'File is too large (max 5GB)'
  else if (rejectionError?.code === 'file-invalid-type')
    rejectionMessage = 'Invalid file type (PDF only)'
  else if (rejectionError) rejectionMessage = 'Invalid file'

  if (value) {
    return (
      <div className="relative flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </div>
        <div className="flex-1 truncate">
          <p className="text-sm font-medium text-slate-900 truncate">{value.split('/').pop()}</p>
          <p className="text-xs text-slate-500">PDF Document</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-slate-400 hover:text-rose-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 transition-all hover:border-primary/50 hover:bg-primary/5',
        isDragActive && 'border-primary bg-primary/5',
        isUploading && 'pointer-events-none opacity-60'
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-600">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {isDragActive ? 'Drop file here' : 'Click or drag PDF to upload'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {rejectionMessage || 'Max file size: 5GB'}
            </p>
          </div>
        </div>
      )}
      {rejectionMessage && (
        <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase">{rejectionMessage}</p>
      )}
    </div>
  )
}
