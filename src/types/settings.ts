export interface WebsiteSettings {
  id: string
  siteName: string
  tagline: string
  companyName: string
  description: string
  about: string
  logoUrl: string
  faviconUrl: string | null
  contactEmail: string
  contactPhone: string
  contactAddress: string
  createdAt: string
  updatedAt: string
}

export interface WebsiteSettingsRow {
  id: string
  site_name: string
  tagline: string
  company_name: string
  description: string | null
  about: string | null
  logo_url: string | null
  favicon_url: string | null
  contact_email: string
  contact_phone: string
  contact_address: string
  created_at: string
  updated_at: string
}

export function toWebsiteSettings(row: WebsiteSettingsRow): WebsiteSettings {
  return {
    id: row.id,
    siteName: row.site_name,
    tagline: row.tagline,
    companyName: row.company_name,
    description: row.description || '',
    about: row.about || '',
    logoUrl: row.logo_url || '',
    faviconUrl: row.favicon_url,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    contactAddress: row.contact_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}
