'use client'

import { useEffect, useState } from 'react'
import { Bot, Brain, CheckCircle2, ChevronDown, HelpCircle, Loader2, Send, Sparkles, Trash2, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { askInventoryQuestionAction } from '@/app/actions/ai-actions'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  thinking?: string
}

interface InventoryQaTabProps {
  locale: string
}

const THINKING_STEPS_ID = [
  'Mengidentifikasi maksud pertanyaan dan parameter inventaris...',
  'Mengambil snapshot faktual (katalog produk, stok fisik, kategori)...',
  'Menghitung ringkasan metrik, valuasi total, dan ambang batas stok...',
  'Menjalankan penalaran model AI 9Router & memverifikasi guardrails...',
  'Menyusun jawaban faktual terverifikasi...'
]

const THINKING_STEPS_EN = [
  'Identifying query intent and inventory parameters...',
  'Fetching factual snapshot (products, stock levels, categories)...',
  'Calculating metric summaries, total valuation, and stock alerts...',
  'Executing 9Router model inference & verifying guardrails...',
  'Formulating verified factual answer...'
]

export function InventoryQaTab({ locale }: InventoryQaTabProps) {
  const t = useTranslations('assistant.qaTab')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputQuestion, setInputQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [thinkingStep, setThinkingStep] = useState(0)

  const steps = locale === 'en' ? THINKING_STEPS_EN : THINKING_STEPS_ID
  const SUGGESTIONS = [t('chipLowStock'), t('chipCategories'), t('chipValuation'), t('chipSummary')]

  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 1400)
    return () => clearInterval(interval)
  }, [isLoading, steps.length])

  const handleSend = async (questionText: string) => {
    const q = questionText.trim()
    if (!q || isLoading) return

    setThinkingStep(0)
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${prev.length + 1}`,
        role: 'user',
        content: q
      }
    ])
    setInputQuestion('')
    setIsLoading(true)

    const res = await askInventoryQuestionAction(
      {
        question: q,
        locale: locale as 'id' | 'en'
      },
      locale
    )

    setIsLoading(false)

    if (!res.success) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${prev.length + 1}`,
          role: 'assistant',
          content: `⚠️ ${res.message}`
        }
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${prev.length + 1}`,
          role: 'assistant',
          content: res.data.answer,
          sources: res.data.sources,
          thinking: res.data.thinking
        }
      ])
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-primary/20 bg-primary/5 text-primary flex items-center gap-2 rounded-xl border p-3 text-xs">
        <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{t('disclaimer')}</span>
      </div>

      <Card className="border-border flex h-[580px] flex-col shadow-xs">
        <CardHeader className="border-border flex flex-row items-center justify-between border-b pb-3">
          <div>
            <CardTitle className="text-base font-bold">{t('title')}</CardTitle>
            <CardDescription className="text-xs">{t('subtitle')}</CardDescription>
          </div>
          {messages.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="text-muted-foreground hover:text-foreground gap-1 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t('clearChat')}</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-2xl">
                <Bot className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">{t('emptyChat')}</p>
              <div className="w-full max-w-md space-y-1.5 text-left">
                <span className="text-muted-foreground text-[11px] font-medium">{t('suggestedChips')}</span>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(s)}
                      className="bg-muted hover:bg-muted/80 text-foreground border-border rounded-lg border px-3 py-2 text-left text-xs transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-xs' : 'bg-muted/60 border-border rounded-bl-xs border'
                  }`}
                >
                  {m.role === 'user' ? <p className="whitespace-pre-wrap">{m.content}</p> : <MarkdownRenderer content={m.content} />}

                  {/* Collapsible AI Thinking & Reasoning Details */}
                  {m.thinking && (
                    <details className="group border-border/80 bg-background/60 mt-2.5 rounded-lg border p-2 text-[11px]">
                      <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center justify-between gap-1.5 font-semibold select-none">
                        <span className="flex items-center gap-1.5">
                          <Brain className="text-accent h-3.5 w-3.5" aria-hidden="true" />
                          <span>Detail Proses Penalaran & Analisis AI</span>
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="border-border/60 text-muted-foreground mt-2 max-h-48 overflow-y-auto border-t pt-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                        {m.thinking}
                      </div>
                    </details>
                  )}

                  {m.sources && m.sources.length > 0 && (
                    <div className="border-border/60 text-muted-foreground mt-2 border-t pt-1.5 text-[10px]">
                      <span className="font-semibold">{t('sourcesLabel')}: </span>
                      <span>{m.sources.join(', ')}</span>
                    </div>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Real-time Thinking & Analysis Progress Indicator */}
          {isLoading && (
            <div className="flex justify-start gap-2.5">
              <div className="bg-primary/10 text-primary flex h-7 w-7 shrink-0 animate-pulse items-center justify-center rounded-lg">
                <Bot className="h-4 w-4" />
              </div>
              <div className="border-primary/20 bg-primary/5 max-w-[85%] space-y-2.5 rounded-2xl rounded-bl-xs border p-3.5 shadow-2xs">
                <div className="text-primary flex items-center gap-2 text-xs font-bold">
                  <Sparkles className="text-accent h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>AI sedang berpikir & menganalisis inventaris...</span>
                </div>
                <div className="space-y-1.5 pl-0.5">
                  {steps.slice(0, thinkingStep + 1).map((stepText, idx) => {
                    const isCurrent = idx === thinkingStep
                    return (
                      <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                        {isCurrent ? (
                          <Loader2 className="text-accent mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                        )}
                        <span className={isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground/75'}>{stepText}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-border bg-card border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(inputQuestion)
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={t('inputPlaceholder')}
              disabled={isLoading}
              className="flex-1 text-xs"
            />
            <Button type="submit" size="sm" disabled={isLoading || !inputQuestion.trim()} className="gap-1.5 text-xs font-semibold">
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('sendButton')}</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
