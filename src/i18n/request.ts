import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

// Explicit, bundler-analyzable loaders per locale
const messageLoaders = {
  id: async () => ({
    index: (await import('../../messages/id/index.json')).default,
    common: (await import('../../messages/id/common.json')).default,
    navigation: (await import('../../messages/id/navigation.json')).default,
    sidebar: (await import('../../messages/id/sidebar.json')).default,
    auth: (await import('../../messages/id/auth.json')).default,
    dashboard: (await import('../../messages/id/dashboard.json')).default,
    validation: (await import('../../messages/id/validation.json')).default,
    assistant: (await import('../../messages/id/assistant.json')).default
  }),
  en: async () => ({
    index: (await import('../../messages/en/index.json')).default,
    common: (await import('../../messages/en/common.json')).default,
    navigation: (await import('../../messages/en/navigation.json')).default,
    sidebar: (await import('../../messages/en/sidebar.json')).default,
    auth: (await import('../../messages/en/auth.json')).default,
    dashboard: (await import('../../messages/en/dashboard.json')).default,
    validation: (await import('../../messages/en/validation.json')).default,
    assistant: (await import('../../messages/en/assistant.json')).default
  })
} as const

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Validate locale; fallback to defaultLocale ('id') if invalid or missing
  if (!locale || !(locale in messageLoaders)) {
    locale = routing.defaultLocale
  }

  // Load only the dictionary for the requested locale
  const messages = await messageLoaders[locale as keyof typeof messageLoaders]()

  return {
    locale,
    messages
  }
})
