'use client'

import { ArrowDown, ArrowUp, ArrowUpDown, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { Column } from '@tanstack/react-table'

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn('text-xs font-semibold', className)}>{title}</div>
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="data-[state=open]:bg-accent -ml-2.5 h-8 gap-1.5 px-2.5 text-xs font-semibold">
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDown className="text-primary h-3.5 w-3.5" aria-hidden="true" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUp className="text-primary h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ArrowUpDown className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)} className="gap-2">
            <ArrowUp className="text-muted-foreground h-3.5 w-3.5" />
            <span>Asc (A-Z)</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)} className="gap-2">
            <ArrowDown className="text-muted-foreground h-3.5 w-3.5" />
            <span>Desc (Z-A)</span>
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)} className="gap-2">
                <EyeOff className="text-muted-foreground h-3.5 w-3.5" />
                <span>Sembunyikan</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
