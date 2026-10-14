import { z } from 'zod'

export const userRoleEnum = z.enum(['administrator', 'staff_gudang', 'auditor', 'admin_gudang', 'owner'], {
  error: 'Peran pengguna tidak valid'
})

export const userInputSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid').trim().toLowerCase(),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100, 'Nama lengkap maksimal 100 karakter').trim(),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter').max(72, 'Kata sandi maksimal 72 karakter'),
  role: userRoleEnum
})

export type UserInput = z.infer<typeof userInputSchema>

export const userUpdateSchema = z.object({
  id: z.string().uuid('ID pengguna tidak valid'),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100, 'Nama lengkap maksimal 100 karakter').trim(),
  role: userRoleEnum,
  password: z.string().min(6, 'Kata sandi minimal 6 karakter').max(72, 'Kata sandi maksimal 72 karakter').optional().or(z.literal(''))
})

export type UserUpdate = z.infer<typeof userUpdateSchema>
