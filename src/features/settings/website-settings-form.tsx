'use client'

import { useState, useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Building2, CheckCircle2, Globe, Info, Loader2, Mail, MapPin, Phone, Save } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'

import { updateWebsiteSettingsAction } from '@/app/actions/website-settings-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { websiteSettingsSchema } from '@/schemas/website-settings-schema'

import type { WebsiteSettingsInput } from '@/schemas/website-settings-schema'
import type { WebsiteSettings } from '@/types/settings'

interface WebsiteSettingsFormProps {
  initialSettings: WebsiteSettings
  locale: string
}

export function WebsiteSettingsForm({ initialSettings, locale }: WebsiteSettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<WebsiteSettingsInput>({
    resolver: zodResolver(websiteSettingsSchema),
    defaultValues: {
      siteName: initialSettings.siteName,
      tagline: initialSettings.tagline,
      companyName: initialSettings.companyName,
      description: initialSettings.description,
      about: initialSettings.about,
      logoUrl: initialSettings.logoUrl,
      faviconUrl: initialSettings.faviconUrl || '',
      contactEmail: initialSettings.contactEmail,
      contactPhone: initialSettings.contactPhone,
      contactAddress: initialSettings.contactAddress
    }
  })

  const logoUrlValue = useWatch({ control, name: 'logoUrl' })

  const onSubmit = (formData: WebsiteSettingsInput) => {
    setSuccessNotice(null)
    setErrorMessage(null)

    startTransition(async () => {
      const res = await updateWebsiteSettingsAction(formData, locale)
      if (!res.success) {
        setErrorMessage(res.message)
        return
      }

      setSuccessNotice('Pengaturan identitas website dan kontak perusahaan berhasil disimpan!')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {successNotice && (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2.5 rounded-lg border p-3 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Identitas Branding */}
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Globe className="text-primary h-4 w-4" />
            <span>Identitas & Profil Website</span>
          </CardTitle>
          <CardDescription className="text-xs">Nama sistem, slogan, perusahaan pemilik, dan logo yang tampil pada navigasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="siteName" className="text-xs font-semibold">
                Nama Website / Aplikasi
              </Label>
              <Input id="siteName" className="text-xs" {...register('siteName')} />
              {errors.siteName && <p className="text-destructive text-[11px]">{errors.siteName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="companyName" className="text-xs font-semibold">
                Nama Badan Usaha / Perusahaan
              </Label>
              <Input id="companyName" className="text-xs" {...register('companyName')} />
              {errors.companyName && <p className="text-destructive text-[11px]">{errors.companyName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tagline" className="text-xs font-semibold">
              Tagline / Slogan
            </Label>
            <Input id="tagline" className="text-xs" {...register('tagline')} />
            {errors.tagline && <p className="text-destructive text-[11px]">{errors.tagline.message}</p>}
          </div>

          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="logoUrl" className="text-xs font-semibold">
                URL Logo (Opsional)
              </Label>
              <Input id="logoUrl" placeholder="https://..." className="text-xs" {...register('logoUrl')} />
              {errors.logoUrl && <p className="text-destructive text-[11px]">{errors.logoUrl.message}</p>}
            </div>

            {logoUrlValue && (
              <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrlValue} alt="Preview Logo" className="h-9 w-9 rounded object-contain" />
                <span className="text-muted-foreground truncate text-[11px]">Pratinjau Logo Aktif</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deskripsi & Tentang */}
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Info className="text-primary h-4 w-4" />
            <span>Deskripsi & Tentang Sistem</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Penjelasan umum dan konteks operasional sistem inventaris untuk pengguna dan evaluator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Deskripsi Singkat
            </Label>
            <Textarea id="description" rows={2} className="text-xs" {...register('description')} />
            {errors.description && <p className="text-destructive text-[11px]">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="about" className="text-xs font-semibold">
              Tentang Perusahaan / Sistem
            </Label>
            <Textarea id="about" rows={3} className="text-xs" {...register('about')} />
            {errors.about && <p className="text-destructive text-[11px]">{errors.about.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Kontak Perusahaan */}
      <Card className="shadow-2xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Building2 className="text-primary h-4 w-4" />
            <span>Informasi Kontak & Alamat</span>
          </CardTitle>
          <CardDescription className="text-xs">Saluran kontak resmi untuk operasional dan audit logistik.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail" className="flex items-center gap-1.5 text-xs font-semibold">
                <Mail className="text-muted-foreground h-3.5 w-3.5" />
                <span>Email Kontak</span>
              </Label>
              <Input id="contactEmail" className="text-xs" {...register('contactEmail')} />
              {errors.contactEmail && <p className="text-destructive text-[11px]">{errors.contactEmail.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone" className="flex items-center gap-1.5 text-xs font-semibold">
                <Phone className="text-muted-foreground h-3.5 w-3.5" />
                <span>Nomor Telepon</span>
              </Label>
              <Input id="contactPhone" className="text-xs" {...register('contactPhone')} />
              {errors.contactPhone && <p className="text-destructive text-[11px]">{errors.contactPhone.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contactAddress" className="flex items-center gap-1.5 text-xs font-semibold">
              <MapPin className="text-muted-foreground h-3.5 w-3.5" />
              <span>Alamat Kantor / Pergudangan</span>
            </Label>
            <Textarea id="contactAddress" rows={2} className="text-xs" {...register('contactAddress')} />
            {errors.contactAddress && <p className="text-destructive text-[11px]">{errors.contactAddress.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Submit Action */}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isPending} className="gap-2 px-5">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Simpan Pengaturan</span>
        </Button>
      </div>
    </form>
  )
}
