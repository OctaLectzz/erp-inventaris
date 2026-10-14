'use client'

import ReactMarkdown from 'react-markdown'

import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null

  return (
    <div className={cn('markdown-content space-y-2 text-xs leading-relaxed', className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="text-foreground font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-foreground mt-3 mb-1 text-sm font-extrabold">{children}</h1>,
          h2: ({ children }) => <h2 className="text-foreground mt-2.5 mb-1 text-xs font-bold tracking-wider uppercase">{children}</h2>,
          h3: ({ children }) => <h3 className="text-foreground mt-2 mb-1 text-xs font-bold">{children}</h3>,
          code: ({ children }) => (
            <code className="border-border bg-muted/60 text-accent rounded border px-1 py-0.5 font-mono text-[11px]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="border-border bg-muted/80 my-2 overflow-x-auto rounded-lg border p-2.5 font-mono text-[11px]">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-primary/40 text-muted-foreground my-2 border-l-2 pl-3 italic">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="border-border my-2 overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-border bg-muted/50 border-b px-2.5 py-1.5 font-bold">{children}</th>,
          td: ({ children }) => <td className="border-border/60 border-b px-2.5 py-1.5 last:border-b-0">{children}</td>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
