import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { SystemDashboard } from './system/SystemDashboard'

interface SystemUptimeProps {
  refreshInterval?: number; // in milliseconds, default 15 seconds
}

export const SystemUptime: React.FC<SystemUptimeProps> = ({
  refreshInterval = 500,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <SystemDashboard refreshInterval={refreshInterval} />
      </CardContent>
    </Card>
  )
}
