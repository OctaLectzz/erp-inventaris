import { z } from 'zod'

export const websiteSettingsSchema = z.object({
  siteName: z.string().min(2, 'Nama website minimal 2 karakter').max(100, 'Nama website maksimal 100 karakter').trim(),
  tagline: z.string().min(2, 'Tagline minimal 2 karakter').max(200, 'Tagline maksimal 200 karakter').trim(),
  companyName: z.string().min(2, 'Nama perusahaan minimal 2 karakter').max(100, 'Nama perusahaan maksimal 100 karakter').trim(),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
  about: z.string().max(3000, 'Tentang kami maksimal 3000 karakter').optional().or(z.literal('')),
  logoUrl: z.string().url('Format URL logo tidak valid').optional().or(z.literal('')),
  faviconUrl: z.string().url('Format URL favicon tidak valid').optional().or(z.literal('')),
  contactEmail: z.string().email('Format email kontak tidak valid').trim().toLowerCase(),
  contactPhone: z.string().min(5, 'Nomor telepon minimal 5 karakter').max(30, 'Nomor telepon maksimal 30 karakter').trim(),
  contactAddress: z.string().min(5, 'Alamat perusahaan minimal 5 karakter').max(300, 'Alamat perusahaan maksimal 300 karakter').trim()
})

export type WebsiteSettingsInput = z.infer<typeof websiteSettingsSchema>
