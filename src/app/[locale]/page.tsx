import Link from 'next/link'
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Database,
  History,
  Lock,
  Package,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const tIndex = await getTranslations({ locale, namespace: 'index' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const modules = [
    {
      key: 'modulA',
      icon: ShieldCheck,
      color: 'text-primary bg-primary/10 border-primary/20',
      badgeVariant: 'default' as const
    },
    {
      key: 'modulB',
      icon: Boxes,
      color: 'text-accent bg-accent/10 border-accent/20',
      badgeVariant: 'default' as const
    },
    {
      key: 'modulC',
      icon: ArrowLeftRight,
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
      badgeVariant: 'default' as const
    },
    {
      key: 'modulD',
      icon: History,
      color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20 dark:text-indigo-400',
      badgeVariant: 'default' as const
    },
    {
      key: 'modulE',
      icon: BarChart3,
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
      badgeVariant: 'default' as const
    },
    {
      key: 'modulF',
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400',
      badgeVariant: 'secondary' as const
    }
  ]

  const demoRoles = [
    {
      key: 'admin',
      icon: Shield,
      accent: 'border-l-primary',
      badgeClass: 'bg-primary/10 text-primary border-primary/20'
    },
    {
      key: 'staff',
      icon: Package,
      accent: 'border-l-accent',
      badgeClass: 'bg-accent/10 text-accent border-accent/20'
    },
    {
      key: 'auditor',
      icon: UserCheck,
      accent: 'border-l-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    }
  ]

  return (
    <div className="bg-background text-foreground selection:bg-accent/20 selection:text-accent-foreground flex min-h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="border-border bg-background/90 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-primary text-lg font-extrabold tracking-tight">{tCommon('brand.name')}</span>
              <span className="text-muted-foreground hidden text-xs sm:ml-2 sm:inline-block">• {tCommon('brand.subtitle')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="bg-accent/10 text-accent border-accent/20 hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex">
              <span className="bg-accent h-2 w-2 animate-pulse rounded-full" />
              {tIndex('statusActive')}
            </span>

            <LocaleSwitcher />
            <ThemeToggle />

            <Button size="sm" asChild className="hidden gap-1.5 sm:inline-flex">
              <Link href={`/${locale}/login`}>
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tIndex('actions.login')}</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-20 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-20">
          {/* Hero Section */}
          <section className="space-y-6 pt-4 text-center">
            <div className="border-border bg-secondary/80 text-secondary-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold shadow-2xs">
              <Sparkles className="text-accent h-3.5 w-3.5" aria-hidden="true" />
              <span>{tIndex('badge')}</span>
            </div>

            <h1 className="text-primary mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{tIndex('title')}</h1>

            <p className="text-muted-foreground mx-auto max-w-3xl text-sm leading-relaxed sm:text-lg">{tIndex('subtitle')}</p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button size="lg" asChild className="gap-2 font-bold shadow-md">
                <Link href={`/${locale}/login`}>
                  <span>{tIndex('actions.login')}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#modules">{tIndex('actions.modules')}</Link>
              </Button>
            </div>
          </section>

          {/* Evaluator Quick-Access Demo Section */}
          <section id="demo" className="scroll-mt-20 space-y-6" aria-labelledby="demo-access-heading">
            <div className="space-y-1 text-center sm:text-left">
              <Badge variant="outline" className="border-accent/30 bg-accent/5 text-accent text-[11px] font-semibold">
                {tIndex('demoSection.badge')}
              </Badge>
              <h2 id="demo-access-heading" className="text-primary text-xl font-extrabold sm:text-2xl">
                {tIndex('demoSection.title')}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">{tIndex('demoSection.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {demoRoles.map((role) => (
                <Card key={role.key} className={`border-border border-l-4 shadow-xs transition-shadow hover:shadow-md ${role.accent}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <role.icon className="text-primary h-4 w-4" aria-hidden="true" />
                        <CardTitle className="text-foreground text-base font-bold">{tIndex(`demoSection.roles.${role.key}.title` as any)}</CardTitle>
                      </div>
                      <Badge variant="outline" className={`font-mono text-[10px] ${role.badgeClass}`}>
                        {role.key}
                      </Badge>
                    </div>
                    <CardDescription className="font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {tIndex(`demoSection.roles.${role.key}.email` as any)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-2">
                    <p className="text-muted-foreground min-h-[48px] text-xs leading-relaxed">
                      {tIndex(`demoSection.roles.${role.key}.desc` as any)}
                    </p>
                    <Button variant="secondary" size="sm" asChild className="w-full gap-1.5 text-xs font-semibold">
                      <Link href={`/${locale}/login`}>
                        <span>{tIndex('demoSection.actionButton')}</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* 6 Core Modules Section (Take-Home Test Brief Ringkas) */}
          <section id="modules" className="scroll-mt-20 space-y-6" aria-labelledby="modules-heading">
            <div className="space-y-1 text-center sm:text-left">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold">
                {tIndex('modulesSection.badge')}
              </Badge>
              <h2 id="modules-heading" className="text-primary text-xl font-extrabold sm:text-2xl">
                {tIndex('modulesSection.title')}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">{tIndex('modulesSection.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <Card key={mod.key} className="border-border shadow-xs transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${mod.color}`}>
                        <mod.icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <Badge variant={mod.badgeVariant} className="text-[10px]">
                        {tIndex(`modulesSection.modules.${mod.key}.tag` as any)}
                      </Badge>
                    </div>
                    <CardTitle className="text-foreground pt-3 text-base font-bold">
                      {tIndex(`modulesSection.modules.${mod.key}.title` as any)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs leading-relaxed">{tIndex(`modulesSection.modules.${mod.key}.desc` as any)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Key Business Rules Compliance Matrix */}
          <section className="border-border bg-card/60 space-y-6 rounded-2xl border p-6 shadow-xs sm:p-8">
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
              >
                {tIndex('rulesSection.badge')}
              </Badge>
              <h2 className="text-primary text-xl font-extrabold sm:text-2xl">{tIndex('rulesSection.title')}</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">{tIndex('rulesSection.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="border-border bg-background/80 flex items-start gap-3 rounded-xl border p-4">
                  <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-foreground text-xs font-bold">{tIndex(`rulesSection.rules.${idx}.title` as any)}</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{tIndex(`rulesSection.rules.${idx}.desc` as any)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quality Gates & Software Engineering Standards */}
          <section className="bg-secondary/40 border-border rounded-2xl border p-6 text-center sm:p-8">
            <div className="mx-auto max-w-2xl space-y-1">
              <Badge variant="outline" className="text-[11px] font-semibold">
                {tIndex('qualitySection.badge')}
              </Badge>
              <h2 className="text-primary text-xl font-extrabold sm:text-2xl">{tIndex('qualitySection.title')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
              <div className="border-border bg-background rounded-xl border p-4 shadow-2xs">
                <p className="text-primary font-mono text-2xl font-extrabold">{tIndex('qualitySection.stats.tests')}</p>
                <p className="text-muted-foreground mt-1 text-xs">{tIndex('qualitySection.stats.testsLabel')}</p>
              </div>
              <div className="border-border bg-background rounded-xl border p-4 shadow-2xs">
                <p className="text-primary font-mono text-2xl font-extrabold">{tIndex('qualitySection.stats.files')}</p>
                <p className="text-muted-foreground mt-1 text-xs">{tIndex('qualitySection.stats.filesLabel')}</p>
              </div>
              <div className="border-border bg-background rounded-xl border p-4 shadow-2xs">
                <p className="text-accent font-mono text-2xl font-extrabold">{tIndex('qualitySection.stats.lint')}</p>
                <p className="text-muted-foreground mt-1 text-xs">{tIndex('qualitySection.stats.lintLabel')}</p>
              </div>
              <div className="border-border bg-background rounded-xl border p-4 shadow-2xs">
                <p className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{tIndex('qualitySection.stats.build')}</p>
                <p className="text-muted-foreground mt-1 text-xs">{tIndex('qualitySection.stats.buildLabel')}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Accessible Footer */}
      <footer className="border-border bg-background/80 text-muted-foreground border-t py-8 text-xs">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Database className="text-accent h-4 w-4" aria-hidden="true" />
            <p className="text-center sm:text-left">{tIndex('footerText')}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <Link href={`/${locale}/login`} className="hover:text-primary transition-colors">
              {tIndex('actions.login')}
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="#modules" className="hover:text-primary transition-colors">
              {tIndex('actions.modules')}
            </Link>
            <span aria-hidden="true">•</span>
            <Link href="#demo" className="hover:text-primary transition-colors">
              {tIndex('actions.quickDemo')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
