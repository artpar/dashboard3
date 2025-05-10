import React from 'react'
import { Activity, BarChart, Database, LayoutDashboard, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SystemStatus } from './SystemStatus'
import { QuickActions } from './QuickActions'
import { ActivityOverview } from './ActivityOverview'
import { EntityStatCard } from './EntityStatCard'
import { DatabaseStats } from './DatabaseStats'
import { EntityActions } from './EntityActions'
import { DashboardAreaChart, DashboardBarChart, DashboardPieChart } from './DataCharts'
import {
  ChartData,
  EntityDistributionData,
  EntityStats as EntityStatsType,
  getEntityColor,
  getEntityIcon,
} from '../utils/dashboardUtils.tsx'
import { SystemDashboard } from '@/features/dashboard/components/system/SystemDashboard.tsx'

interface DashboardTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  totalEntities: number
  totalUsers: number
  credits: number
  isLoadingEntities: boolean
  isLoadingUsers: boolean
  entityStats: EntityStatsType[]
  recentActivity: Record<string, any[]>
  userChartData: ChartData[]
  isLoadingUserAggregates: boolean
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
                                                              activeTab,
                                                              setActiveTab,
                                                              totalEntities,
                                                              totalUsers,
                                                              credits,
                                                              isLoadingEntities,
                                                              isLoadingUsers,
                                                              entityStats,
                                                              recentActivity,
                                                              userChartData,
                                                              isLoadingUserAggregates,
                                                            }) => {
  // Create entity distribution data for pie chart
  const entityDistributionData: EntityDistributionData[] = entityStats
    .filter(stat => !stat.isLoading && stat.count > 0)
    .map(stat => ({
      entityName: stat.entityName,
      count: stat.count,
      color: getEntityColor(stat.entityName),
    }))

  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="overview">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="analytics">
          <BarChart className="mr-2 h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="system">
          <Settings className="mr-2 h-4 w-4" />
          System
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <SystemStatus
          totalEntities={totalEntities}
          totalUsers={totalUsers}
          credits={credits}
          isLoadingEntities={isLoadingEntities}
          isLoadingUsers={isLoadingUsers}
        />

        <QuickActions />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* User Registration Chart */}
          <DashboardAreaChart
            title="User Registrations"
            description="User registration trend over time"
            data={userChartData}
            isLoading={isLoadingUserAggregates}
            color="#3b82f6"
            dataKey="count"
            yAxisLabel="Users"
          />

          {/* Entity Distribution */}
          <DashboardPieChart
            title="Entity Distribution"
            description="Distribution of records across entity types"
            data={entityDistributionData}
            isLoading={isLoadingEntities}
          />
        </div>
      </TabsContent>

      {/* Analytics Tab */}
      <TabsContent value="analytics" className="space-y-4">
        {/* Database Statistics */}
        <DatabaseStats />

        {/* User Registration Trends */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DashboardAreaChart
            title="User Growth Trend"
            description="Cumulative user growth over time"
            data={userChartData}
            isLoading={isLoadingUserAggregates}
            color="#22c55e"
            dataKey="count"
            yAxisLabel="Total Users"
          />

          <DashboardBarChart
            title="User Registration Activity"
            description="New user registrations by date"
            data={userChartData}
            isLoading={isLoadingUserAggregates}
            dataKey="count"
            nameKey="formattedDate"
            color="#a855f7"
          />
        </div>
      </TabsContent>

      {/* System Tab */}
      <TabsContent value="system" className="space-y-4">
        <SystemDashboard refreshInterval={1000} />
      </TabsContent>
    </Tabs>
  )
}
