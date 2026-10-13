import { ArrowRight, Boxes, CheckCircle2, Shield, Sparkles } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'

import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const tIndex = await getTranslations('index')
  const tCommon = await getTranslations('common')

  const tokens = [
    {
      name: tIndex('card.tokens.navy.name'),
      hex: '#0F2D4A',
      token: '--primary',
      desc: tIndex('card.tokens.navy.desc'),
      indicatorClass: 'bg-primary'
    },
    {
      name: tIndex('card.tokens.teal.name'),
      hex: '#14B8A6',
      token: '--accent',
      desc: tIndex('card.tokens.teal.desc'),
      indicatorClass: 'bg-accent'
    },
    {
      name: tIndex('card.tokens.surface.name'),
      hex: '#E6F4F2',
      token: '--secondary',
      desc: tIndex('card.tokens.surface.desc'),
      indicatorClass: 'bg-secondary border border-border'
    }
  ]

  const features = [
    {
      title: tIndex('card.features.typography.title'),
      detail: tIndex('card.features.typography.detail')
    },
    {
      title: tIndex('card.features.styling.title'),
      detail: tIndex('card.features.styling.detail')
    },
    {
      title: tIndex('card.features.typeSafety.title'),
      detail: tIndex('card.features.typeSafety.detail')
    },
    {
      title: tIndex('card.features.i18n.title'),
      detail: tIndex('card.features.i18n.detail')
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-primary">{tCommon('brand.name')}</span>
              <span className="hidden text-xs text-muted-foreground sm:ml-2 sm:inline-block">• {tCommon('brand.subtitle')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline-flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              {tCommon('phases.phase2')}
            </span>

            <div className="flex items-center gap-1.5">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Hero Section */}
          <section className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-secondary-foreground shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{tIndex('badge')}</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl md:text-5xl">{tIndex('title')}</h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">{tIndex('subtitle')}</p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button size="lg" asChild className="gap-2 font-semibold shadow-xs">
                <Link href={`/${locale}/login`}>
                  <span>{tIndex('actions.primary')}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="#preview">{tIndex('actions.secondary')}</Link>
              </Button>
            </div>
          </section>

          {/* Foundation Status Card */}
          <section id="preview" className="pt-4" aria-labelledby="foundation-preview-title">
            <Card className="border-border shadow-md">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle id="foundation-preview-title" className="text-xl font-bold text-primary">
                      {tIndex('card.title')}
                    </CardTitle>
                    <CardDescription>{tIndex('card.description')}</CardDescription>
                  </div>
                  <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary sm:flex">
                    <Shield className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Brand Tokens Palette Preview */}
                <div>
                  <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{tIndex('card.tokensSection')}</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {tokens.map((token) => (
                      <div key={token.token} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-2xs">
                        <span className={`mt-0.5 h-6 w-6 shrink-0 rounded-md shadow-2xs ${token.indicatorClass}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{token.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {token.hex} • {token.token}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">{token.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h2 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{tIndex('card.featuresSection')}</h2>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature) => (
                      <div key={feature.title} className="flex items-start gap-2.5 rounded-lg bg-secondary/40 p-3 text-xs">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                        <div>
                          <p className="font-semibold text-foreground">{feature.title}</p>
                          <p className="mt-0.5 text-muted-foreground">{feature.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <span>{tIndex('card.footer')}</span>
                <span className="font-mono">{tIndex('card.techStack')}</span>
              </CardFooter>
            </Card>
          </section>
        </div>
      </main>

      {/* Accessible Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>{tIndex('footerText')}</p>
      </footer>
    </div>
  )
}
