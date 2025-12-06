import React, { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsCardProps<T> {
  title: string
  icon: ReactNode
  iconClassName?: string
  subtitle?: ReactNode
  data: T | null
  isLoading: boolean
  loadingSkeletons?: ReactNode
  noDataMessage?: string
  children: (data: T) => ReactNode
}

/**
 * Generic stats card component that handles loading and empty states.
 * Use the children render prop to define how the data should be displayed.
 *
 * @example
 * <StatsCard
 *   title="CPU Usage"
 *   icon={<Cpu className="h-4 w-4 text-blue-500 mr-2" />}
 *   data={cpuStats}
 *   isLoading={isLoading}
 * >
 *   {(data) => <CpuContent data={data} />}
 * </StatsCard>
 */
export function StatsCard<T>({
  title,
  icon,
  subtitle,
  data,
  isLoading,
  loadingSkeletons,
  noDataMessage = 'No data available',
  children,
}: StatsCardProps<T>) {
  const defaultSkeletons = (
    <>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center">
          {icon}
          {title}
        </CardTitle>
        {!isLoading && subtitle}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          loadingSkeletons || defaultSkeletons
        ) : data ? (
          children(data)
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {noDataMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
