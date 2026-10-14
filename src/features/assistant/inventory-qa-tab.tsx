'use client'

import { Bot, HelpCircle, Loader2, Send, Trash2, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { askInventoryQuestionAction } from '@/app/actions/ai-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

interface InventoryQaTabProps {
  locale: string
}

export function InventoryQaTab({ locale }: InventoryQaTabProps) {
  const t = useTranslations('assistant.qaTab')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputQuestion, setInputQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const SUGGESTIONS = [t('chipLowStock'), t('chipCategories'), t('chipValuation'), t('chipSummary')]

  const handleSend = async (questionText: string) => {
    const q = questionText.trim()
    if (!q || isLoading) return

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
          sources: res.data.sources
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

      <Card className="border-border flex h-[520px] flex-col shadow-xs">
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
                  <p className="whitespace-pre-wrap">{m.content}</p>
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
          {isLoading && (
            <div className="text-muted-foreground flex items-center gap-2 pl-2 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t('sending')}</span>
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
