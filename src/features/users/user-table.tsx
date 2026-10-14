'use client'

import { useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Plus, Search, Users as UsersIcon } from 'lucide-react'

import { DataTablePagination } from '@/components/shared/data-table/data-table-pagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getUserColumns } from '@/features/users/user-columns'
import { UserDeleteDialog } from '@/features/users/user-delete-dialog'
import { UserFormDialog } from '@/features/users/user-form-dialog'

import type { UserProfile } from '@/types/auth'

interface UserTableProps {
  initialUsers: UserProfile[]
  currentUserId: string
}

export function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [globalFilter, setGlobalFilter] = useState('')

  // Dialog states
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleOpenCreate = () => {
    setSelectedUser(null)
    setFormMode('create')
    setFormOpen(true)
  }

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user)
    setFormMode('edit')
    setFormOpen(true)
  }

  const handleOpenDelete = (user: UserProfile) => {
    setSelectedUser(user)
    setDeleteOpen(true)
  }

  const handleFormSuccess = (updatedUser: UserProfile) => {
    if (formMode === 'create') {
      setUsers((prev) => [...prev, updatedUser])
    } else {
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
    }
  }

  const handleDeleteSuccess = (deletedUserId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== deletedUserId))
  }

  const columns = useMemo(
    () =>
      getUserColumns({
        currentUserId,
        onEditUser: handleOpenEdit,
        onDeleteUser: handleOpenDelete
      }),
    [currentUserId]
  )

  const table = useReactTable({
    data: users,
    columns,
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            placeholder="Cari nama atau email pengguna..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Button onClick={handleOpenCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* Table Card */}
      <Card className="shadow-2xs">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs font-bold tracking-wider uppercase">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 text-xs">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
                        <UsersIcon className="h-8 w-8 stroke-1" />
                        <p className="text-xs font-medium">Tidak ada data pengguna yang ditemukan.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <DataTablePagination table={table} />

      {/* Dialogs */}
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} mode={formMode} user={selectedUser} onSuccess={handleFormSuccess} />

      <UserDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} user={selectedUser} onSuccess={handleDeleteSuccess} />
    </div>
  )
}
