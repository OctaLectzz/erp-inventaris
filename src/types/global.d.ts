import type auth from '../../messages/id/auth.json'
import type common from '../../messages/id/common.json'
import type dashboard from '../../messages/id/dashboard.json'
import type index from '../../messages/id/index.json'
import type navigation from '../../messages/id/navigation.json'
import type sidebar from '../../messages/id/sidebar.json'
import type validation from '../../messages/id/validation.json'

declare global {
  // Use type-safe messages based on authoritative Indonesian dictionary
  interface IntlMessages {
    index: typeof index
    common: typeof common
    navigation: typeof navigation
    sidebar: typeof sidebar
    auth: typeof auth
    dashboard: typeof dashboard
    validation: typeof validation
  }
}
