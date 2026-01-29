'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MapPin, Car, Gavel, ListOrdered, Calculator } from 'lucide-react'
import type { ReactNode } from 'react'

interface SettingsTabsProps {
  activeTab: string
  children: ReactNode[]
}

const tabs = [
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'makes-models', label: 'Makes & Models', icon: Car },
  { id: 'auctions', label: 'Auctions', icon: Gavel },
  { id: 'statuses', label: 'Statuses', icon: ListOrdered },
  { id: 'calculator', label: 'Calculator', icon: Calculator },
]

export function SettingsTabs({ activeTab, children }: SettingsTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`/admin/settings?${params.toString()}`)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="mb-6 w-full justify-start">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab, index) => (
        <TabsContent key={tab.id} value={tab.id}>
          {children[index]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
