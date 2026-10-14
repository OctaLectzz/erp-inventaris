import { Users } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import { UserTable } from '@/features/users/user-table'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/services/auth-service'
import { getUsersList } from '@/services/user-service'
import { canManageUsers } from '@/types/auth'

import type { Metadata } from 'next'

export const instant = false

interface UsersPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: UsersPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'sidebar' })

  return {
    title: `${t('items.users')} | Inventra`,
    description: 'Manajemen akun pengguna dan kontrol akses berbasis peran (RBAC)'
  }
}

export default async function UsersPage({ params }: UsersPageProps) {
  await connection()
  const { locale } = await params
  setRequestLocale(locale)

  const { profile } = await requireAuth(locale)

  if (!canManageUsers(profile.role)) {
    redirect(`/${locale}/dashboard`)
  }

  const supabase = await createClient()
  const users = await getUsersList(supabase)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">Manajemen Pengguna</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Kelola akun staf gudang, administrator, auditor, dan hak akses sistem (RBAC).</p>
          </div>
        </div>
      </div>

      <UserTable initialUsers={users} currentUserId={profile.id} />
    </div>
  )
}
