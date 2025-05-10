import React from 'react'
import { format } from 'date-fns'
import { Calendar, Users, CreditCard, Activity } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatusCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  isLoading?: boolean
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  description,
  icon,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

interface SystemStatusProps {
  totalEntities: number
  totalUsers: number
  credits: number
  isLoadingEntities: boolean
  isLoadingUsers: boolean
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  totalEntities,
  totalUsers,
  credits,
  isLoadingEntities,
  isLoadingUsers,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        title="Total Entities"
        value={totalEntities}
        description="Records across all entity types"
        icon={<Activity className="text-muted-foreground h-4 w-4" />}
        isLoading={isLoadingEntities}
      />
      
      <StatusCard
        title="Total Users"
        value={totalUsers}
        description="User accounts in the system"
        icon={<Users className="text-muted-foreground h-4 w-4" />}
        isLoading={isLoadingUsers}
      />
      
      <StatusCard
        title="Credits"
        value={credits}
        description="Available credits"
        icon={<CreditCard className="text-muted-foreground h-4 w-4" />}
      />
      
      <StatusCard
        title="Today's Date"
        value={format(new Date(), 'MMM dd, yyyy')}
        description={format(new Date(), 'EEEE')}
        icon={<Calendar className="text-muted-foreground h-4 w-4" />}
      />
    </div>
  )
}
