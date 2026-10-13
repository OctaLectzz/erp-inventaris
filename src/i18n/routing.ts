import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // Supported locales
  locales: ['id', 'en'],

  // Default locale is Indonesian
  defaultLocale: 'id',

  // Clean root URL for Indonesian users (/), English at /en
  localePrefix: 'as-needed'
})

export type Locale = (typeof routing.locales)[number]
