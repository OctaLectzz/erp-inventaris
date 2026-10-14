'use client'

import { useCallback, useRef, useState } from 'react'
import { AlertCircle, Image as ImageIcon, Link as LinkIcon, Loader2, Trash2, UploadCloud } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ImageDropzoneProps {
  value?: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
  bucketName?: string
  skuHint?: string
  className?: string
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
}

/**
 * Validates the file header magic bytes to prevent file extension spoofing or malicious payloads.
 */
export async function validateImageMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 12)
    const buffer = await slice.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // JPEG signature: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return file.type === 'image/jpeg'
    }

    // PNG signature: 89 50 4E 47 (\x89PNG)
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return file.type === 'image/png'
    }

    // WebP signature: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return file.type === 'image/webp'
    }

    return false
  } catch {
    return false
  }
}

export function ImageDropzone({ value, onChange, disabled = false, bucketName = 'product-images', skuHint, className }: ImageDropzoneProps) {
  const t = useTranslations('dashboard')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isManualUrlMode, setIsManualUrlMode] = useState(false)
  const [manualUrlInput, setManualUrlInput] = useState(value || '')

  const handleUpload = useCallback(
    async (file: File) => {
      setErrorMessage(null)

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setErrorMessage(t('imageDropzone.errors.invalidType'))
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(t('imageDropzone.errors.tooLarge'))
        return
      }

      const isValidMagic = await validateImageMagicBytes(file)
      if (!isValidMagic) {
        setErrorMessage(t('imageDropzone.errors.corruptOrInvalid'))
        return
      }

      setIsUploading(true)

      try {
        const supabase = createClient()
        const ext = MIME_TO_EXT[file.type] || 'jpg'
        const cleanSku = (skuHint || 'product').toLowerCase().replace(/[^a-z0-9_-]/g, '_')
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        const filePath = `${cleanSku}-${uniqueId}.${ext}`

        const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

        if (uploadError) {
          throw uploadError
        }

        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

        if (!publicUrlData?.publicUrl) {
          throw new Error('Failed to retrieve public image URL')
        }

        onChange(publicUrlData.publicUrl)
        setManualUrlInput(publicUrlData.publicUrl)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setErrorMessage(msg)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [bucketName, onChange, skuHint, t]
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      void handleUpload(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      void handleUpload(files[0])
    }
  }

  const handleRemove = () => {
    onChange(null)
    setManualUrlInput('')
    setErrorMessage(null)
  }

  const handleManualUrlApply = () => {
    const trimmed = manualUrlInput.trim()
    if (!trimmed) {
      onChange(null)
      setErrorMessage(null)
      return
    }

    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
      setErrorMessage(t('imageDropzone.errors.invalidUrlScheme'))
      return
    }

    onChange(trimmed)
    setErrorMessage(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileChange}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border p-2.5 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preview or Drop Area */}
      {value ? (
        <div className="border-border bg-card/50 flex flex-col items-center gap-3 rounded-lg border p-3 sm:flex-row">
          <div className="border-border bg-secondary relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Product preview" className="h-full w-full object-cover" />
            {isUploading && (
              <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
                <Loader2 className="text-primary h-5 w-5 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center space-y-1.5 text-center sm:text-left">
            <span className="text-muted-foreground line-clamp-1 font-mono text-[11px] break-all">{value}</span>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs"
              >
                <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('imageDropzone.replaceImage')}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={disabled || isUploading}
                onClick={handleRemove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('imageDropzone.removeImage')}</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click()
            }
          }}
          className={cn(
            'border-border hover:border-primary/50 hover:bg-primary/5 relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all',
            isDragging && 'border-primary bg-primary/10',
            (disabled || isUploading) && 'pointer-events-none opacity-60'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileInputRef.current?.click()
            }
          }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-foreground text-xs font-medium">{t('imageDropzone.uploading')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1.5">
              <div className="bg-secondary text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
                <ImageIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-foreground text-xs font-semibold">{t('imageDropzone.dropzoneTitle')}</p>
              <p className="text-muted-foreground text-[11px]">{t('imageDropzone.dropzoneSubtitle')}</p>
              <p className="text-muted-foreground/80 text-[10px]">{t('imageDropzone.acceptedFormats')}</p>
            </div>
          )}
        </div>
      )}

      {/* Manual URL Toggle and Input */}
      <div className="pt-1">
        {!isManualUrlMode ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setIsManualUrlMode(true)}
            className="text-muted-foreground hover:text-foreground h-6 text-[11px]"
          >
            <LinkIcon className="h-3 w-3" aria-hidden="true" />
            <span>{t('imageDropzone.orManualUrl')}</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="url"
              placeholder={t('imageDropzone.manualUrlPlaceholder')}
              value={manualUrlInput}
              onChange={(e) => setManualUrlInput(e.target.value)}
              onBlur={handleManualUrlApply}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleManualUrlApply()
                }
              }}
              className="h-8 text-xs"
              disabled={disabled || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleManualUrlApply}
              className="h-8 shrink-0 text-xs"
              disabled={disabled || isUploading}
            >
              OK
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
