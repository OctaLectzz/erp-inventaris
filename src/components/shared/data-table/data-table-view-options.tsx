'use client'

import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import type { Table } from '@tanstack/react-table'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  columnLabels?: Record<string, string>
  triggerLabel?: string
  titleLabel?: string
}

export function DataTableViewOptions<TData>({
  table,
  columnLabels = {},
  triggerLabel = 'Tampilan Kolom',
  titleLabel = 'Atur Kolom'
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs shadow-2xs">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{triggerLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">{titleLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            const label = columnLabels[column.id] || column.id
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="text-xs capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {label}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
