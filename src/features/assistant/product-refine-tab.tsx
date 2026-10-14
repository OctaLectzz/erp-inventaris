'use client'

import { AlertCircle, Check, Copy, Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { refineProductDescriptionAction } from '@/app/actions/ai-actions'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import type { AiRefineMode } from '@/types/ai'

interface ProductRefineTabProps {
  locale: string
  isAuditor: boolean
}

export function ProductRefineTab({ locale, isAuditor }: ProductRefineTabProps) {
  const t = useTranslations('assistant.refineTab')

  const [text, setText] = useState('')
  const [mode, setMode] = useState<AiRefineMode>('expand')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refinedOutput, setRefinedOutput] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || isLoading) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await refineProductDescriptionAction(
      {
        text: text.trim(),
        mode,
        locale: locale as 'id' | 'en'
      },
      locale
    )

    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message)
    } else {
      setRefinedOutput(res.data.refined)
    }
  }

  const handleCopy = () => {
    if (!refinedOutput) return
    navigator.clipboard.writeText(refinedOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const MODES: { id: AiRefineMode; label: string }[] = [
    { id: 'expand', label: t('modes.expand') },
    { id: 'specifications', label: t('modes.specifications') },
    { id: 'shorten', label: t('modes.shorten') },
    { id: 'translate', label: t('modes.translate') }
  ]

  return (
    <div className="space-y-6">
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">{t('inputLabel')}</CardTitle>
          <CardDescription className="text-xs">
            Sempurnakan tata bahasa, ekstrak spesifikasi poin-poin, ringkas, atau terjemahkan deskripsi katalog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProcess} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('modeLabel')}</Label>
              <div className="flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <Button
                    key={m.id}
                    type="button"
                    variant={mode === m.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode(m.id)}
                    disabled={isLoading || isAuditor}
                    className="text-xs"
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="raw-text" className="text-xs font-semibold">
                {t('inputLabel')}
              </Label>
              <Textarea
                id="raw-text"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('inputPlaceholder')}
                disabled={isLoading || isAuditor}
                className="text-xs"
              />
            </div>

            {errorMessage && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading || !text.trim() || isAuditor} className="gap-1.5 text-xs font-semibold">
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>{t('processingButton')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('actionButton')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {refinedOutput && (
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">{t('resultTitle')}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? t('copied') : t('copyResult')}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/40 rounded-lg border p-4 text-xs">
              <MarkdownRenderer content={refinedOutput} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
