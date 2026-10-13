'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function MovementsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md border-destructive/30 text-center shadow-lg">
        <CardContent className="space-y-4 p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">Gagal Memuat Riwayat Mutasi</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Terjadi kendala saat mengambil data riwayat pergerakan stok dari basis data. Silakan coba kembali.
            </p>
            {error.message && <p className="mt-2 rounded bg-muted p-2 font-mono text-[11px] text-muted-foreground">{error.message}</p>}
          </div>

          <Button onClick={reset} size="sm" className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Coba Lagi</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
