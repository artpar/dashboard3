import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useAuthStore } from '@/stores/authStore'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { DashboardTabs } from './components/DashboardTabs'
import {
  getEntityIcon,
  getEntityColor,
  processChartData,
  EntityStats,
  AggregateData,
} from './utils/dashboardUtils.tsx'

const Dashboard = () => {
  const { user, customer, creator } = useAuthStore()
  const {
    entities,
    groupedEntities,
    isLoading: isLoadingEntities,
  } = useWorldEntities()

  const [activeTab, setActiveTab] = useState('overview')
  const [entityStats, setEntityStats] = useState<EntityStats[]>([])
  const [totalEntities, setTotalEntities] = useState(0)
  const [recentActivity, setRecentActivity] = useState<Record<string, any[]>>(
    {}
  )

  // Get user aggregate data
  const { data: userAggregateData, isLoading: isLoadingUserAggregates } =
    useQuery({
      queryKey: ['user-aggregates'],
      queryFn: async () => {
        try {
          const result = await daptinClient.aggregateClient
            .entity('user_account')
            .groupBy('date(created_at)')
            .project('date(created_at) as day')
            .count()
            .execute()

          return result as AggregateData[]
        } catch (error) {
          console.error('Failed to fetch user aggregates:', error)
          return []
        }
      },
    })

  // Get entity counts
  useEffect(() => {
    const fetchEntityCounts = async () => {
      if (!entities || entities.length === 0) return

      const topLevelEntities = groupedEntities.topLevel
        .filter((entity) => !entity.table_name.startsWith('_'))
        .slice(0, 9) // Increased to 9 entities for more comprehensive display

      const stats: EntityStats[] = []
      let totalCount = 0

      for (const entity of topLevelEntities) {
        try {
          stats.push({
            entityName: entity.table_name,
            count: 0, // Initial value
            icon: getEntityIcon(entity.table_name),
            description: `Manage ${entity.table_name.replace(/_/g, ' ')}`,
            path: `/${entity.table_name}`,
            isLoading: true,
            color: getEntityColor(entity.table_name),
          })

          // Fetch count for this entity
          const response = await daptinClient.jsonApi.findAll(
            entity.table_name,
            {
              'page[size]': '1',
            }
          )

          const index = stats.length - 1
          if (response && response.meta && response.meta.total) {
            stats[index] = {
              ...stats[index],
              count: response.meta.total,
              isLoading: false,
            }
            totalCount += response.meta.total
          } else {
            stats[index] = {
              ...stats[index],
              isLoading: false,
            }
          }
        } catch (error) {
          console.error(`Error fetching count for ${entity.table_name}:`, error)
        }
      }

      setEntityStats(stats)
      setTotalEntities(totalCount)
    }

    fetchEntityCounts()
  }, [entities, groupedEntities])

  // Fetch recent activity
  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!entities || entities.length === 0) return

      const activityEntities = groupedEntities.topLevel
        .filter((entity) => !entity.table_name.startsWith('_'))
        .slice(0, 6) // Increased to 6 entities for more comprehensive activity view

      const activity: Record<string, any[]> = {}

      for (const entity of activityEntities) {
        try {
          const response = await daptinClient.jsonApi.findAll(
            entity.table_name,
            {
              'page[size]': '5',
              sort: '-created_at',
            }
          )

          if (response && response.data) {
            activity[entity.table_name] = response.data
          }
        } catch (error) {
          console.error(
            `Error fetching recent activity for ${entity.table_name}:`,
            error
          )
        }
      }

      setRecentActivity(activity)
    }

    fetchRecentActivity()
  }, [entities, groupedEntities])

  // Process user chart data
  const userChartData = processChartData(userAggregateData)

  // Get total users
  const getTotalUsers = (): number => {
    if (!userAggregateData) return 0
    return userAggregateData.reduce(
      (total, item) => total + item.attributes.count,
      0
    )
  }

  return (
    <div className='w-full space-y-6 overflow-y-auto pb-8'>
      {/* User welcome section */}
      <div className='pb-2'>
        <div className='text-2xl'>
          Welcome,{' '}
          {creator?.creator_name ||
            customer?.customer_name ||
            user?.name ||
            'User'}
        </div>
        <div className='text-sm text-gray-500'>
          Dashboard overview of your Daptin system
        </div>
      </div>

      {/* Dashboard Tabs */}
      <DashboardTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalEntities={totalEntities}
        totalUsers={getTotalUsers()}
        credits={customer?.credit || 0}
        isLoadingEntities={isLoadingEntities}
        isLoadingUsers={isLoadingUserAggregates}
        entityStats={entityStats}
        recentActivity={recentActivity}
        userChartData={userChartData}
        isLoadingUserAggregates={isLoadingUserAggregates}
      />
    </div>
  )
}

export default Dashboard
