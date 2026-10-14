'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, AlertTriangle, Loader2, Trash2 } from 'lucide-react'

import { deleteUserAction } from '@/app/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { UserProfile } from '@/types/auth'

interface UserDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile | null
  onSuccess: (userId: string) => void
}

export function UserDeleteDialog({ open, onOpenChange, user, onSuccess }: UserDeleteDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!user) return null

  const handleDelete = () => {
    setErrorMessage(null)
    startTransition(async () => {
      const res = await deleteUserAction(user.id)
      if (!res.success) {
        setErrorMessage(res.message)
        return
      }

      onSuccess(user.id)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="bg-destructive/10 text-destructive mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-base">Hapus Akun Pengguna</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Apakah Anda yakin ingin menghapus akun pengguna <strong className="text-foreground">{user.fullName}</strong> ({user.email})? Tindakan ini
            tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-3 text-xs">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <DialogFooter className="pt-2 sm:justify-between">
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={handleDelete} className="gap-2">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Trash2 className="h-3.5 w-3.5" />
            <span>Ya, Hapus Akun</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
