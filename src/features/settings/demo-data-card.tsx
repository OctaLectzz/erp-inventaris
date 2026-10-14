'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, DownloadCloud, Loader2, RefreshCw } from 'lucide-react'

import { syncDummyJsonCatalogAction } from '@/app/actions/system-actions'
import { Button } from '@/components/ui/button'

interface DemoDataCardProps {
  locale: string
}

export function DemoDataCard({ locale }: DemoDataCardProps) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null)

  const handleSync = () => {
    setFeedback(null)
    startTransition(async () => {
      const res = await syncDummyJsonCatalogAction(locale)
      if (res.success) {
        setFeedback({
          success: true,
          message: res.message || 'Sinkronisasi 30 produk DummyJSON berhasil.'
        })
      } else {
        setFeedback({
          success: false,
          message: res.message || 'Gagal menyinkronkan data dari DummyJSON.'
        })
      }
    })
  }

  return (
    <div className="border-border space-y-3 rounded-xl border p-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DownloadCloud className="text-primary h-4 w-4" aria-hidden="true" />
          <span className="text-foreground font-bold">Sinkronisasi Katalog Demo (DummyJSON)</span>
        </div>
        <span className="text-muted-foreground font-mono text-[10px]">dummyjson.com/products</span>
      </div>

      <p className="text-muted-foreground text-[11px] leading-relaxed">
        Sesuai spesifikasi Modul B Take-Home Test: mengambil 30 data produk awal dari DummyJSON, menghasilkan SKU unik deterministik, dan mengonversi
        harga USD ke Rupiah (Rp 16.000). Stok operasional produk yang sudah ada tetap terjaga secara aman.
      </p>

      {feedback && (
        <div
          role={feedback.success ? 'status' : 'alert'}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-[11px] font-medium ${
            feedback.success
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          {feedback.success && <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="pt-1">
        <Button type="button" size="sm" variant="outline" onClick={handleSync} disabled={isPending} className="gap-2 text-xs font-semibold">
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              <span>Menyinkronkan dari DummyJSON...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sinkronkan 30 Produk DummyJSON</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
