import { describe, expect, it } from 'vitest'

import { websiteSettingsSchema } from '@/schemas/website-settings-schema'

describe('Website Settings Schema Validation', () => {
  it('validates a complete, valid website settings payload', () => {
    const valid = {
      siteName: 'Inventra ERP',
      tagline: 'Logistik & Inventaris Terintegrasi',
      companyName: 'PT Syailendra Bumi Investama',
      description: 'Sistem manajemen pergudangan',
      about: 'Tentang perusahaan dan komitmen kualitas',
      logoUrl: 'https://example.com/logo.png',
      faviconUrl: 'https://example.com/favicon.ico',
      contactEmail: 'contact@inventra.demo',
      contactPhone: '+62 812-9999-8888',
      contactAddress: 'Jl. Raya Industri No. 12, Bogor'
    }

    const res = websiteSettingsSchema.safeParse(valid)
    expect(res.success).toBe(true)
  })

  it('rejects invalid email and invalid logo URL', () => {
    const invalid = {
      siteName: 'Inventra',
      tagline: 'Tagline',
      companyName: 'Company',
      logoUrl: 'not-a-valid-url',
      contactEmail: 'invalid-email',
      contactPhone: '12345',
      contactAddress: 'Alamat'
    }

    const res = websiteSettingsSchema.safeParse(invalid)
    expect(res.success).toBe(false)
    if (!res.success) {
      const paths = res.error.issues.map((i) => i.path[0])
      expect(paths).toContain('logoUrl')
      expect(paths).toContain('contactEmail')
    }
  })

  it('accepts optional empty strings for logo and favicon', () => {
    const validWithEmpty = {
      siteName: 'Inventra ERP',
      tagline: 'Logistik & Inventaris',
      companyName: 'PT Syailendra',
      description: '',
      about: '',
      logoUrl: '',
      faviconUrl: '',
      contactEmail: 'contact@inventra.demo',
      contactPhone: '+62 812-9999-8888',
      contactAddress: 'Jl. Raya Industri'
    }

    const res = websiteSettingsSchema.safeParse(validWithEmpty)
    expect(res.success).toBe(true)
  })
})
