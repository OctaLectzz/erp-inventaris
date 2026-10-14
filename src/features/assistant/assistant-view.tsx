'use client'

import { useState } from 'react'
import { FileEdit, MessageSquare, Sparkles, Wand2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AssistantStatusBanner } from './assistant-status-banner'
import { InventoryQaTab } from './inventory-qa-tab'
import { ProductDraftTab } from './product-draft-tab'
import { ProductRefineTab } from './product-refine-tab'

import type { AiConfigStatus } from '@/types/ai'

interface AssistantViewProps {
  locale: string
  canSaveToCatalog: boolean
  isAuditor: boolean
  categories: string[]
  configStatus: AiConfigStatus
}

type TabType = 'draft' | 'refine' | 'qa'

export function AssistantView({ locale, canSaveToCatalog, isAuditor, categories, configStatus }: AssistantViewProps) {
  const t = useTranslations('assistant')
  const [activeTab, setActiveTab] = useState<TabType>(isAuditor ? 'qa' : 'draft')

  const TABS: { id: TabType; label: string; icon: React.ElementType; disabled?: boolean }[] = [
    {
      id: 'draft',
      label: t('tabs.draft'),
      icon: Wand2,
      disabled: isAuditor
    },
    {
      id: 'refine',
      label: t('tabs.refine'),
      icon: FileEdit,
      disabled: isAuditor
    },
    {
      id: 'qa',
      label: t('tabs.qa'),
      icon: MessageSquare
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-2xs">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-primary text-2xl font-extrabold tracking-tight sm:text-3xl">{t('title')}</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      <AssistantStatusBanner status={configStatus} />

      <div className="border-border flex gap-2 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                isActive ? 'border-primary text-primary' : 'text-muted-foreground hover:text-foreground border-transparent'
              } ${tab.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      <div>
        {activeTab === 'draft' && (
          <ProductDraftTab locale={locale} canSaveToCatalog={canSaveToCatalog} isAuditor={isAuditor} categories={categories} />
        )}

        {activeTab === 'refine' && <ProductRefineTab locale={locale} isAuditor={isAuditor} />}

        {activeTab === 'qa' && <InventoryQaTab locale={locale} />}
      </div>
    </div>
  )
}
