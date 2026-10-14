'use client'

import { useState, useTransition } from 'react'
import { Bell, Check, CheckCircle2, Database, Info, Laptop, Loader2, Lock, Moon, Palette, Shield, ShieldCheck, Sun, User } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

import { updateProfileNameAction } from '@/app/actions/auth-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogoutButton } from '@/features/auth/logout-button'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

import type { UserProfile } from '@/types/auth'

interface SettingsViewProps {
  profile: UserProfile
  locale: string
}

type TabType = 'profile' | 'appearance' | 'security' | 'notifications' | 'about'

export function SettingsView({ profile, locale }: SettingsViewProps) {
  const t = useTranslations('dashboard.settings')
  const tAuth = useTranslations('auth')
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [fullName, setFullName] = useState(profile.fullName)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isSavingName, startTransition] = useTransition()

  const isAdmin = profile.role === 'admin_gudang' || profile.role === 'administrator'

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSuccess(null)
    setProfileError(null)

    if (fullName.trim().length < 2) {
      setProfileError('Nama lengkap harus minimal 2 karakter.')
      return
    }

    startTransition(async () => {
      const result = await updateProfileNameAction(fullName, locale)
      if (result.success) {
        setProfileSuccess(t('profile.successNotice'))
      } else {
        setProfileError(result.message || 'Gagal memperbarui profil.')
      }
    })
  }

  const handleSwitchLanguage = (targetLocale: 'id' | 'en') => {
    if (targetLocale === currentLocale) return
    router.replace(pathname, { locale: targetLocale })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{t('title')}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
      </div>

      {/* Main Layout: Submenu Sidebar & Content Area */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        {/* Submenu Tabs List */}
        <nav
          className="border-border bg-card flex flex-row flex-wrap gap-1 rounded-xl border p-1.5 shadow-2xs sm:flex-col lg:col-span-1"
          aria-label="Submenu Pengaturan"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-initial',
              activeTab === 'profile' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <User className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('tabs.profile')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'appearance'}
            onClick={() => setActiveTab('appearance')}
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-initial',
              activeTab === 'appearance'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Palette className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('tabs.appearance')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-initial',
              activeTab === 'security' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('tabs.security')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-initial',
              activeTab === 'notifications'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('tabs.notifications')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'about'}
            onClick={() => setActiveTab('about')}
            className={cn(
              'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors sm:flex-initial',
              activeTab === 'about' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('tabs.about')}</span>
          </button>
        </nav>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          {/* TAB 1: PROFIL */}
          {activeTab === 'profile' && (
            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-bold">{t('profile.title')}</CardTitle>
                <CardDescription className="text-xs">{t('profile.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileSuccess && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="border-accent/40 bg-accent/10 text-accent-foreground dark:text-accent flex items-center gap-2.5 rounded-lg border p-3 text-xs font-medium"
                  >
                    <CheckCircle2 className="text-accent h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2.5 rounded-lg border p-3 text-xs font-medium"
                  >
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Full Name Field (Editable) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-fullName" className="text-foreground text-xs font-semibold">
                      {t('profile.fullNameLabel')}
                    </Label>
                    <Input
                      id="settings-fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('profile.fullNamePlaceholder')}
                      disabled={isSavingName}
                      className="max-w-md text-xs font-medium"
                      required
                    />
                  </div>

                  {/* Email Field (Strictly Read-Only) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-email" className="text-foreground text-xs font-semibold">
                      {t('profile.emailLabel')}
                    </Label>
                    <Input id="settings-email" value={profile.email} disabled className="bg-muted/50 max-w-md font-mono text-xs opacity-75" />
                    <p className="text-muted-foreground text-[11px]">{t('profile.emailNotice')}</p>
                  </div>

                  {/* Role Field (Strictly Read-Only with Guard Notice) */}
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-xs font-semibold">{t('profile.roleLabel')}</Label>
                    <div className="flex max-w-md items-center gap-2.5">
                      <div className="border-border bg-muted/40 text-foreground flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold">
                        <Shield className="text-accent h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{isAdmin ? tAuth('roles.admin_gudang') : tAuth('roles.owner')}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">({profile.role})</span>
                      </div>
                    </div>
                    <div className="border-border/60 bg-muted/20 text-muted-foreground flex max-w-md items-start gap-2 rounded-lg border p-2.5 text-[11px]">
                      <Lock className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <p>{t('profile.roleNotice')}</p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button type="submit" size="sm" disabled={isSavingName} className="gap-2 font-semibold">
                      {isSavingName ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          <span>{t('profile.savingButton')}</span>
                        </>
                      ) : (
                        <span>{t('profile.saveButton')}</span>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: TAMPILAN */}
          {activeTab === 'appearance' && (
            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-bold">{t('appearance.title')}</CardTitle>
                <CardDescription className="text-xs">{t('appearance.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Theme Selector */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-foreground text-sm font-bold">{t('appearance.themeTitle')}</h3>
                    <p className="text-muted-foreground text-xs">{t('appearance.themeSubtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={cn(
                        'border-border hover:border-accent flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                        theme === 'light' ? 'border-accent bg-accent/10 shadow-2xs' : 'bg-card'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                          <Sun className="h-4 w-4" />
                        </div>
                        <span className="text-foreground text-xs font-bold">{t('appearance.themeLight')}</span>
                      </div>
                      {theme === 'light' && <Check className="text-accent h-4 w-4" aria-hidden="true" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={cn(
                        'border-border hover:border-accent flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                        theme === 'dark' ? 'border-accent bg-accent/10 shadow-2xs' : 'bg-card'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                          <Moon className="h-4 w-4" />
                        </div>
                        <span className="text-foreground text-xs font-bold">{t('appearance.themeDark')}</span>
                      </div>
                      {theme === 'dark' && <Check className="text-accent h-4 w-4" aria-hidden="true" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme('system')}
                      className={cn(
                        'border-border hover:border-accent flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                        theme === 'system' ? 'border-accent bg-accent/10 shadow-2xs' : 'bg-card'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
                          <Laptop className="h-4 w-4" />
                        </div>
                        <span className="text-foreground text-xs font-bold">{t('appearance.themeSystem')}</span>
                      </div>
                      {theme === 'system' && <Check className="text-accent h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="border-border space-y-3 border-t pt-6">
                  <div>
                    <h3 className="text-foreground text-sm font-bold">{t('appearance.languageTitle')}</h3>
                    <p className="text-muted-foreground text-xs">{t('appearance.languageSubtitle')}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchLanguage('id')}
                      className={cn(
                        'border-border hover:border-accent flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                        currentLocale === 'id' ? 'border-accent bg-accent/10 shadow-2xs' : 'bg-card'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-secondary text-primary rounded-md px-2 py-1 font-mono text-xs font-bold">ID</span>
                        <div>
                          <p className="text-foreground text-xs font-bold">{t('appearance.langId')}</p>
                          <p className="text-muted-foreground text-[10px]">Bahasa Utama Sistem</p>
                        </div>
                      </div>
                      {currentLocale === 'id' && <Check className="text-accent h-4 w-4" aria-hidden="true" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchLanguage('en')}
                      className={cn(
                        'border-border hover:border-accent flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                        currentLocale === 'en' ? 'border-accent bg-accent/10 shadow-2xs' : 'bg-card'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-secondary text-primary rounded-md px-2 py-1 font-mono text-xs font-bold">EN</span>
                        <div>
                          <p className="text-foreground text-xs font-bold">{t('appearance.langEn')}</p>
                          <p className="text-muted-foreground text-[10px]">English Interface</p>
                        </div>
                      </div>
                      {currentLocale === 'en' && <Check className="text-accent h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: AKUN & KEAMANAN */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg font-bold">{t('security.title')}</CardTitle>
                  <CardDescription className="text-xs">{t('security.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Session Information */}
                  <div className="border-border space-y-3 rounded-lg border p-4">
                    <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">{t('security.sessionTitle')}</h3>
                    <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">{t('security.userId')}</span>
                        <span className="text-foreground font-mono font-medium">{profile.id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">{t('security.role')}</span>
                        <span className="text-primary font-bold">{profile.role}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">{t('security.status')}</span>
                        <Badge variant="success" className="mt-0.5 text-[10px]">
                          {t('security.statusActive')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Password Management Notice */}
                  <div className="border-border space-y-2 rounded-lg border p-4">
                    <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">{t('security.passwordTitle')}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{t('security.passwordNotice')}</p>
                  </div>

                  {/* Security Protections Active */}
                  <div className="space-y-3">
                    <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">{t('security.securityFeaturesTitle')}</h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="border-border bg-muted/20 flex items-start gap-2.5 rounded-lg border p-3 text-xs">
                        <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-foreground font-bold">{t('security.guardRls')}</p>
                          <p className="text-muted-foreground text-[11px]">{t('security.guardRlsDesc')}</p>
                        </div>
                      </div>

                      <div className="border-border bg-muted/20 flex items-start gap-2.5 rounded-lg border p-3 text-xs">
                        <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-foreground font-bold">{t('security.guardLock')}</p>
                          <p className="text-muted-foreground text-[11px]">{t('security.guardLockDesc')}</p>
                        </div>
                      </div>

                      <div className="border-border bg-muted/20 flex items-start gap-2.5 rounded-lg border p-3 text-xs">
                        <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-foreground font-bold">{t('security.guardImmutability')}</p>
                          <p className="text-muted-foreground text-[11px]">{t('security.guardImmutabilityDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* End Session Button with Confirmation */}
                  <div className="border-border border-t pt-4">
                    <LogoutButton locale={locale} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TAB 4: PREFERENSI NOTIFIKASI */}
          {activeTab === 'notifications' && (
            <Card className="border-border shadow-xs">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-lg font-bold">{t('notifications.title')}</CardTitle>
                  <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent text-[10px]">
                    {t('notifications.statusBadge')}
                  </Badge>
                </div>
                <CardDescription className="text-xs">{t('notifications.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-xl border p-8 text-center">
                  <div className="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
                    <Bell className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-foreground text-sm font-bold">{t('notifications.noticeTitle')}</h3>
                  <p className="text-muted-foreground mt-1 max-w-md text-xs leading-relaxed">{t('notifications.noticeDesc')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TAB 5: TENTANG APLIKASI */}
          {activeTab === 'about' && (
            <Card className="border-border shadow-xs">
              <CardHeader>
                <CardTitle className="text-foreground text-lg font-bold">{t('about.title')}</CardTitle>
                <CardDescription className="text-xs">{t('about.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* App Brand Header */}
                <div className="border-border bg-secondary/30 flex items-center gap-4 rounded-xl border p-4">
                  <div className="bg-primary text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold shadow-xs">
                    INV
                  </div>
                  <div>
                    <h3 className="text-primary text-base font-extrabold">{t('about.appName')}</h3>
                    <p className="text-muted-foreground text-xs font-semibold">{t('about.version')}</p>
                    <p className="text-muted-foreground/80 text-[11px]">{t('about.client')}</p>
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="space-y-3">
                  <h3 className="text-foreground text-xs font-bold tracking-wider uppercase">{t('about.stackTitle')}</h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">Next.js 16 (Turbopack)</Badge>
                    <Badge variant="secondary">React 19</Badge>
                    <Badge variant="secondary">TypeScript Strict</Badge>
                    <Badge variant="secondary">Tailwind CSS v4</Badge>
                    <Badge variant="secondary">shadcn/ui & Radix UI</Badge>
                    <Badge variant="secondary">Supabase PostgreSQL</Badge>
                    <Badge variant="secondary">next-intl (Bilingual)</Badge>
                    <Badge variant="secondary">Vitest v3</Badge>
                  </div>
                </div>

                {/* Connectivity & Health Status */}
                <div className="border-border space-y-2 rounded-xl border p-4 text-xs">
                  <div className="text-foreground flex items-center gap-2 font-bold">
                    <Database className="text-accent h-4 w-4" aria-hidden="true" />
                    <span>{t('about.statusTitle')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="font-semibold">{t('about.dbConnected')}</span>
                  </div>
                  <p className="text-muted-foreground font-mono text-[10px]">{t('about.environment')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
