import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useSystemStats } from './system/useSystemStats'
import { CpuStats } from './system/CpuStats'
import { MemoryStats } from './system/MemoryStats'
import { DiskStats } from './system/DiskStats'
import { DbConnectionStats } from './system/DbConnectionStats'

interface SystemHealthProps {
  refreshInterval?: number
}

export const SystemHealth: React.FC<SystemHealthProps> = ({
  refreshInterval = 30000,
}) => {
  const { statistics, isLoading } = useSystemStats({ refreshInterval })

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-base font-medium">Resource Usage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CpuStats cpuStats={statistics?.cpu || null} isLoading={isLoading} />
          <MemoryStats memoryStats={statistics?.memory || null} isLoading={isLoading} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DbConnectionStats dbStats={statistics?.db || null} isLoading={isLoading} />
          <DiskStats diskStats={statistics?.disk || null} isLoading={isLoading} />
        </div>
      </CardContent>
    </Card>
  )
}

// This is kept for backward compatibility but no longer used directly
export const defaultSystemMetrics = []
