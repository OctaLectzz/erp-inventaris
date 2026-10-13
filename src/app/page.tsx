import { ArrowRight, Boxes, CheckCircle2, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

// Structured UI dictionary designed for smooth next-intl migration in Phase 2
const pageCopy = {
  badge: 'Mini ERP Inventaris Gudang',
  title: 'Sistem Manajemen Inventaris Terpadu',
  subtitle:
    'Solusi pemantauan stok real-time, pencatatan mutasi barang masuk & keluar, serta audit trail pergerakan inventaris yang transparan untuk PT. Syailendra Bumi Investama (DDistillers).',
  actions: {
    primary: 'Masuk ke Dashboard',
    secondary: 'Dokumentasi Arsitektur'
  },
  card: {
    title: 'Status Fondasi Sistem (Fase 1)',
    description: 'Spesifikasi token warna semantik, skala tipografi, dan komponen dasar yang telah terkonfigurasi.',
    tokens: [
      {
        name: 'Primary Navy',
        hex: '#0F2D4A',
        token: '--primary',
        desc: 'Navigasi, tajuk utama, dan aksi primer',
        indicatorClass: 'bg-primary'
      },
      {
        name: 'Accent Teal',
        hex: '#14B8A6',
        token: '--accent',
        desc: 'Sorotan aktif, indikator fokus, dan CTA',
        indicatorClass: 'bg-accent'
      },
      {
        name: 'Pale Surface',
        hex: '#E6F4F2',
        token: '--secondary',
        desc: 'Permukaan kontras lembut dan badge netral',
        indicatorClass: 'bg-secondary border border-border'
      }
    ],
    features: [
      {
        title: 'Tipografi Inter & Geist Mono',
        detail: 'Hierarki tipe data reguler dan monospaced SKU'
      },
      {
        title: 'Tailwind CSS v4 + Radix',
        detail: 'Variabel CSS modern dengan dukungan mode gelap'
      },
      {
        title: 'Strict Type Safety',
        detail: 'TypeScript strict mode tanpa kompromi'
      }
    ],
    footer: 'Inventra v0.1.0-dev • Fondasi Terverifikasi'
  },
  footerText: '© 2026 PT. Syailendra Bumi Investama (DDistillers). Seluruh hak cipta dilindungi.'
}

export default function Home() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-lg shadow-xs">
              <Boxes className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-primary text-lg font-bold tracking-tight">Inventra</span>
              <span className="text-muted-foreground hidden text-xs sm:ml-2 sm:inline-block">• DDistillers Warehouse ERP</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
              <span className="bg-accent h-2 w-2 animate-pulse rounded-full" />
              Fase 1 Fondasi
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Hero Section */}
          <section className="space-y-6 text-center">
            <div className="border-border bg-secondary/60 text-secondary-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium shadow-2xs">
              <Sparkles className="text-accent h-3.5 w-3.5" aria-hidden="true" />
              <span>{pageCopy.badge}</span>
            </div>

            <h1 className="text-primary text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">{pageCopy.title}</h1>

            <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed sm:text-lg">{pageCopy.subtitle}</p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button size="lg" className="gap-2 font-semibold shadow-sm">
                <span>{pageCopy.actions.primary}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link href="#preview">{pageCopy.actions.secondary}</Link>
              </Button>
            </div>
          </section>

          {/* Example Foundation Card */}
          <section id="preview" className="pt-4" aria-labelledby="foundation-preview-title">
            <Card className="border-border shadow-md">
              <CardHeader className="border-border/60 border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle id="foundation-preview-title" className="text-primary text-xl font-bold">
                      {pageCopy.card.title}
                    </CardTitle>
                    <CardDescription>{pageCopy.card.description}</CardDescription>
                  </div>
                  <div className="bg-secondary text-primary hidden h-9 w-9 items-center justify-center rounded-lg sm:flex">
                    <Shield className="h-5 w-5" aria-hidden="true" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {/* Brand Tokens Palette Preview */}
                <div>
                  <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Palet Token Warna Terdaftar</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {pageCopy.card.tokens.map((token) => (
                      <div key={token.name} className="border-border bg-card flex items-start gap-3 rounded-lg border p-3 shadow-2xs">
                        <span className={`mt-0.5 h-6 w-6 shrink-0 rounded-md shadow-2xs ${token.indicatorClass}`} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-sm font-semibold">{token.name}</p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {token.hex} • {token.token}
                          </p>
                          <p className="text-muted-foreground/80 mt-1 line-clamp-1 text-xs">{token.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Specifications */}
                <div>
                  <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">Fondasi Teknis Terverifikasi</h2>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {pageCopy.card.features.map((feature) => (
                      <div key={feature.title} className="bg-secondary/40 flex items-start gap-2.5 rounded-lg p-3 text-xs">
                        <CheckCircle2 className="text-accent mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-foreground font-semibold">{feature.title}</p>
                          <p className="text-muted-foreground mt-0.5">{feature.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-border/60 text-muted-foreground justify-between border-t pt-4 text-xs">
                <span>{pageCopy.card.footer}</span>
                <span className="font-mono">Next.js 16 • Tailwind v4</span>
              </CardFooter>
            </Card>
          </section>
        </div>
      </main>

      {/* Accessible Footer */}
      <footer className="border-border text-muted-foreground border-t py-6 text-center text-xs">
        <p>{pageCopy.footerText}</p>
      </footer>
    </div>
  )
}
