'use client'

import { useEffect, useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, Lock, Mail, User } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { createUserAction, updateUserAction } from '@/app/actions/user-actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { userInputSchema, userUpdateSchema } from '@/schemas/user-schema'

import type { UserProfile } from '@/types/auth'
import type { Resolver } from 'react-hook-form'

interface UserFormValues {
  id?: string
  email: string
  fullName: string
  password?: string
  role: 'administrator' | 'staff_gudang' | 'auditor' | 'admin_gudang' | 'owner'
}

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  user?: UserProfile | null
  onSuccess: (user: UserProfile) => void
}

export function UserFormDialog({ open, onOpenChange, mode, user, onSuccess }: UserFormDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isEdit = mode === 'edit'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? userUpdateSchema : userInputSchema) as unknown as Resolver<UserFormValues>,
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      role: 'staff_gudang'
    }
  })

  const handleDialogChange = (nextOpen: boolean) => {
    if (nextOpen) setErrorMessage(null)
    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (open) {
      if (isEdit && user) {
        reset({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          password: ''
        })
      } else {
        reset({
          email: '',
          fullName: '',
          password: '',
          role: 'staff_gudang'
        })
      }
    }
  }, [open, isEdit, user, reset])

  const onSubmit = (formData: UserFormValues) => {
    setErrorMessage(null)

    startTransition(async () => {
      if (isEdit && user) {
        const res = await updateUserAction({
          id: user.id,
          fullName: formData.fullName,
          role: formData.role,
          password: formData.password || undefined
        })

        if (!res.success) {
          setErrorMessage(res.message)
          return
        }

        if (res.data) onSuccess(res.data)
        onOpenChange(false)
      } else {
        const res = await createUserAction({
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password || '',
          role: formData.role
        })

        if (!res.success) {
          setErrorMessage(res.message)
          return
        }

        if (res.data) onSuccess(res.data)
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="text-primary h-5 w-5" />
            <span>{isEdit ? 'Ubah Profil & Hak Akses Pengguna' : 'Tambah Pengguna Baru'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEdit ? `Perbarui informasi untuk ${user?.email}` : 'Daftarkan akun pengguna baru ke dalam sistem Inventra.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border p-3 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-xs font-semibold">
              Nama Lengkap
            </Label>
            <div className="relative">
              <User className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input id="fullName" placeholder="cth. Budi Santoso" className="pl-9 text-xs" {...register('fullName')} />
            </div>
            {errors.fullName && <p className="text-destructive text-[11px]">{errors.fullName.message as string}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">
              Alamat Email
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                id="email"
                type="email"
                disabled={isEdit}
                placeholder="nama@inventra.demo"
                className="pl-9 text-xs disabled:opacity-60"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-destructive text-[11px]">{errors.email.message as string}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-xs font-semibold">
              Peran Hak Akses (RBAC)
            </Label>
            <select
              id="role"
              className="border-border bg-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-xs shadow-2xs focus:ring-1 focus:outline-hidden"
              {...register('role')}
            >
              <option value="administrator">Administrator (Akses Penuh)</option>
              <option value="owner">Pemilik Usaha (Pengawasan & Manajemen User)</option>
              <option value="staff_gudang">Staf Gudang (Mutasi Operasional Gudang)</option>
              <option value="auditor">Auditor (Pengawasan & Audit Saja)</option>
            </select>
            {errors.role && <p className="text-destructive text-[11px]">{errors.role.message as string}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">
              {isEdit ? 'Ubah Kata Sandi (Kosongkan jika tidak diubah)' : 'Kata Sandi'}
            </Label>
            <div className="relative">
              <Lock className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
              <Input
                id="password"
                type="password"
                placeholder={isEdit ? 'Biarkan kosong untuk mempertahankan' : 'Minimal 6 karakter'}
                className="pl-9 text-xs"
                {...register('password')}
              />
            </div>
            {errors.password && <p className="text-destructive text-[11px]">{errors.password.message as string}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
