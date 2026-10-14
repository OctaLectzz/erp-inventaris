'use client'

import * as React from 'react'
import { useState } from 'react'

import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'

import type { UserProfile } from '@/types/auth'

interface DashboardShellProps {
  locale: string
  profile: UserProfile
  initialCollapsed?: boolean
  children: React.ReactNode
}

export function DashboardShell({ locale, profile, initialCollapsed = false, children }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      if (typeof document !== 'undefined') {
        document.cookie = `sidebar_collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`
      }
      return next
    })
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen">
      {/* Desktop Persistent Lateral Sidebar (hidden on mobile/tablet, visible on lg) */}
      <div className="sticky top-0 hidden h-screen lg:flex lg:shrink-0">
        <AppSidebar locale={locale} profile={profile} isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      {/* Main Content Viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader locale={locale} profile={profile} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>

        {/* Global ERP Footer */}
        <footer className="border-border text-muted-foreground border-t py-4 text-center text-xs">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <span>Inventra &copy; 2026 PT. Syailendra Bumi Investama</span>
            <span className="font-mono text-[11px]">
              Role: <strong className="text-primary font-semibold">{profile.role}</strong>
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
