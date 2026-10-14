'use client'

import { ArrowDownRight, ArrowUpRight, UserCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

import type { StockMovementWithDetails } from '@/types/inventory'

interface MovementRowProps {
  movement: StockMovementWithDetails
  formatDateTime: (iso: string) => string
}

export function MovementTableRow({ movement: m, formatDateTime }: MovementRowProps) {
  const isIn = m.type === 'IN'

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="text-muted-foreground px-4 py-3 font-mono text-[11px] whitespace-nowrap">{formatDateTime(m.createdAt)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-primary font-mono text-xs font-bold">{m.product.sku}</span>
      </td>
      <td className="px-4 py-3">
        <p className="text-foreground max-w-xs truncate font-semibold">{m.product.name}</p>
        <span className="text-muted-foreground font-mono text-[10px] uppercase">{m.product.category}</span>
      </td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        {isIn ? (
          <Badge variant="default" className="gap-1 bg-emerald-600/90 text-[10px] text-white hover:bg-emerald-600">
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            <span>IN</span>
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
            <span>OUT</span>
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs font-bold whitespace-nowrap">
        <span className={isIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
          {isIn ? `+${m.quantity}` : `-${m.quantity}`}
        </span>
      </td>
      <td className="px-4 py-3 text-center font-mono text-xs whitespace-nowrap">
        <span className="text-muted-foreground">{m.stockBefore}</span>
        <span className="text-muted-foreground/60 mx-1">→</span>
        <span className="text-foreground font-bold">{m.stockAfter}</span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1.5 text-xs">
          <UserCheck className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-foreground font-medium">{m.user?.fullName || 'Admin Gudang'}</span>
        </div>
      </td>
      <td className="text-muted-foreground max-w-xs px-4 py-3 text-xs">
        <p className="line-clamp-2">{m.note}</p>
      </td>
    </tr>
  )
}

export function MovementMobileCard({ movement: m, formatDateTime }: MovementRowProps) {
  const isIn = m.type === 'IN'

  return (
    <Card className="border-border">
      <CardContent className="space-y-2.5 p-4 text-xs">
        <div className="flex items-center justify-between">
          {isIn ? (
            <Badge variant="default" className="gap-1 bg-emerald-600 text-[10px] text-white">
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              <span>STOK MASUK (IN)</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1 text-[10px]">
              <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
              <span>STOK KELUAR (OUT)</span>
            </Badge>
          )}
          <span className="text-muted-foreground font-mono text-[10px]">{formatDateTime(m.createdAt)}</span>
        </div>

        <div>
          <span className="text-primary font-mono text-xs font-bold">{m.product.sku}</span>
          <h4 className="text-foreground font-semibold">{m.product.name}</h4>
        </div>

        <div className="border-border bg-muted/30 grid grid-cols-2 gap-2 rounded-md border p-2 font-mono text-[11px]">
          <div>
            <span className="text-muted-foreground text-[10px]">Kuantitas: </span>
            <strong className={isIn ? 'text-emerald-600' : 'text-rose-600'}>{isIn ? `+${m.quantity}` : `-${m.quantity}`} unit</strong>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground text-[10px]">Stok: </span>
            <span>
              {m.stockBefore} → <strong>{m.stockAfter}</strong>
            </span>
          </div>
        </div>

        <div className="border-t pt-2 text-[11px]">
          <div className="text-muted-foreground flex items-center gap-1">
            <UserCheck className="h-3 w-3" aria-hidden="true" />
            <span>Oleh: {m.user?.fullName || 'Admin Gudang'}</span>
          </div>
          <p className="text-muted-foreground mt-1 italic">&ldquo;{m.note}&rdquo;</p>
        </div>
      </CardContent>
    </Card>
  )
}
