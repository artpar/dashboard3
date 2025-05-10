import React from 'react'
import { LayoutDashboard, Activity, Database, BarChart, Settings } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SystemStatus } from './SystemStatus'
import { QuickActions } from './QuickActions'
import { ActivityOverview } from './ActivityOverview'
import { EntityStatCard } from './EntityStatCard'
import { DatabaseStats } from './DatabaseStats'
import { SystemHealth } from './SystemHealth'
import { SystemUptime } from './SystemUptime'
import { EntityActions } from './EntityActions'
import {
  DashboardAreaChart,
  DashboardBarChart,
  DashboardPieChart
} from './DataCharts'
import {
  getEntityIcon,
  getEntityColor,
  EntityStats as EntityStatsType,
  ChartData,
  EntityDistributionData
} from '../utils/dashboardUtils.tsx'

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
        <TabsTrigger value="activity">
          <Activity className="mr-2 h-4 w-4" />
          Activity
        </TabsTrigger>
        <TabsTrigger value="entities">
          <Database className="mr-2 h-4 w-4" />
          Entities
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

      {/* Activity Tab */}
      <TabsContent value="activity" className="space-y-4">
        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(recentActivity).map(([entityName, items]) => (
            <ActivityOverview
              key={entityName}
              entityName={entityName}
              items={items}
              icon={getEntityIcon(entityName)}
            />
          ))}
        </div>

        {/* User Registration Bar Chart */}
        <DashboardBarChart
          title="User Registrations by Date"
          description="Detailed view of user registrations"
          data={userChartData}
          isLoading={isLoadingUserAggregates}
          dataKey="count"
          nameKey="formattedDate"
          color="#3b82f6"
        />

        {/* Entity Actions */}
        <EntityActions />
      </TabsContent>

      {/* Entities Tab */}
      <TabsContent value="entities" className="space-y-4">
        {/* Entity Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entityStats.map((stat) => (
            <EntityStatCard
              key={stat.entityName}
              entityName={stat.entityName}
              count={stat.count}
              icon={stat.icon}
              description={stat.description}
              path={stat.path}
              isLoading={stat.isLoading}
            />
          ))}
        </div>

        {/* Entity Distribution Chart */}
        <DashboardBarChart
          title="Entity Distribution"
          description="Distribution of records across entity types"
          data={entityStats.filter(stat => !stat.isLoading)}
          isLoading={isLoadingEntities}
          dataKey="count"
          nameKey="entityName"
          color="#3b82f6"
          layout="vertical"
        />
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
        {/* System Uptime & Status - Live */}
        <SystemUptime refreshInterval={15000} />
        
        {/* System Health */}
        <SystemHealth refreshInterval={15000} />

        {/* Database Stats */}
        <DatabaseStats />

        {/* Entity Actions */}
        <EntityActions />
      </TabsContent>
    </Tabs>
  )
}
