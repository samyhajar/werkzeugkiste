'use client'

import { Button } from '@/components/ui/button'

interface AnalyticsHeaderProps {
  onRefresh: () => Promise<void>
  isLoading?: boolean
}

export default function AnalyticsHeader({ onRefresh, isLoading = false }: AnalyticsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Platform insights and performance metrics
        </p>
      </div>
      <Button
        onClick={onRefresh}
        variant="outline"
        className="border-[#486681] text-[#486681] hover:bg-[#486681]/10 shadow-sm"
        disabled={isLoading}
      >
        <span className="mr-2">🔄</span>
        {isLoading ? 'Refreshing...' : 'Refresh Data'}
      </Button>
    </div>
  )
}