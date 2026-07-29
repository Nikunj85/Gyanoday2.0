'use client'

import { FileUp, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onUpload: (file: File) => Promise<string>
  onRemove: () => void
  value?: string | null
  disabled?: boolean
}

export function ImageUpload({ onUpload, onRemove, value, disabled = false }: ImageUploadProps) {
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
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: disabled || isUploading,
  })

  const rejectionError = fileRejections[0]?.errors[0]
  let rejectionMessage = ''
  if (rejectionError?.code === 'file-too-large') rejectionMessage = 'File is too large (max 5MB)'
  else if (rejectionError?.code === 'file-invalid-type')
    rejectionMessage = 'Invalid file type (PNG, JPG, WEBP only)'

  if (value) {
    return (
      <div className="group relative aspect-video w-full max-w-[400px] overflow-hidden rounded-2xl border-2 border-slate-200 bg-slate-100 shadow-sm transition-all hover:border-primary/30">
        <Image
          src={value}
          alt="Subject image"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay on Hover */}
        <div
          {...getRootProps()}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 transform translate-y-2 transition-transform group-hover:translate-y-0 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <FileUp className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider">Change Image</p>
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          disabled={disabled}
          className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full border border-white/20 bg-rose-500/90 shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
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
        'relative flex aspect-video w-full max-w-[400px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-inner',
        isDragActive && 'border-primary bg-primary/5',
        (disabled || isUploading) && 'pointer-events-none opacity-60'
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
          </div>
          <p className="text-sm font-bold text-slate-600 animate-pulse">Uploading Image...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <FileUp className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              {isDragActive ? 'Drop image here' : 'Set Subject Image'}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1 max-w-[200px]">
              {rejectionMessage || 'Drag and drop or click to browse files (JPG, PNG, WEBP)'}
            </p>
          </div>
        </div>
      )}
      {rejectionMessage && (
        <p className="absolute bottom-4 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md">
          {rejectionMessage}
        </p>
      )}
    </div>
  )
}
