import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

import type { UserProfile } from '@/types/auth'

interface GetUserColumnsProps {
  currentUserId: string
  onEditUser: (user: UserProfile) => void
  onDeleteUser: (user: UserProfile) => void
}

export function getUserRoleBadge(role: string) {
  switch (role) {
    case 'administrator':
    case 'admin_gudang':
      return {
        label: 'Administrator',
        variant: 'default' as const,
        className: 'bg-primary text-primary-foreground font-semibold'
      }
    case 'owner':
      return {
        label: 'Pemilik Usaha',
        variant: 'outline' as const,
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
      }
    case 'staff_gudang':
      return {
        label: 'Staf Gudang',
        variant: 'outline' as const,
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold'
      }
    case 'auditor':
    default:
      return {
        label: 'Auditor',
        variant: 'outline' as const,
        className: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold'
      }
  }
}

export function getUserColumns({ currentUserId, onEditUser, onDeleteUser }: GetUserColumnsProps): ColumnDef<UserProfile>[] {
  return [
    {
      accessorKey: 'fullName',
      header: 'Pengguna',
      cell: ({ row }) => {
        const user = row.original
        const isSelf = user.id === currentUserId
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {user.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-foreground truncate text-sm font-semibold">{user.fullName}</span>
                {isSelf && (
                  <Badge variant="outline" className="border-primary/40 text-primary px-1.5 py-0 text-[10px]">
                    Anda
                  </Badge>
                )}
              </div>
              <span className="text-muted-foreground truncate font-mono text-xs">{user.email}</span>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'role',
      header: 'Peran Akses (RBAC)',
      cell: ({ row }) => {
        const role = row.original.role
        const meta = getUserRoleBadge(role)
        return (
          <Badge variant={meta.variant} className={meta.className}>
            {meta.label}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Terdaftar Sejak',
      cell: ({ row }) => {
        const dateStr = row.original.createdAt
        const formatted = new Date(dateStr).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
        return <span className="text-muted-foreground text-xs">{formatted}</span>
      }
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const user = row.original
        const isSelf = user.id === currentUserId

        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Menu Opsi</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Kelola Pengguna</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEditUser(user)} className="cursor-pointer gap-2 text-xs">
                  <Pencil className="text-muted-foreground h-3.5 w-3.5" />
                  <span>Ubah Profil & Peran</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isSelf}
                  onClick={() => onDeleteUser(user)}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2 text-xs disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus Akun</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    }
  ]
}
