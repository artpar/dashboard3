import React, { useMemo } from 'react'
import { useEntityAggregateData } from './DataCharts'
import { DashboardAreaChart, DashboardBarChart } from './DataCharts'
import { processChartData } from '../utils/dashboardUtils'

interface UserGrowthProps {
  areaChartTitle?: string
  barChartTitle?: string
}

export const UserGrowth: React.FC<UserGrowthProps> = ({
  areaChartTitle = 'User Growth Trend',
  barChartTitle = 'User Registration Activity'
}) => {
  // Fetch user aggregate data using the aggregate endpoint
  const { data: userAggregateData, isLoading } = useEntityAggregateData('user_account', 'date(created_at)')
  
  // Process user chart data
  const userChartData = useMemo(() => {
    return processChartData(userAggregateData)
  }, [userAggregateData])
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* User Growth Area Chart */}
      <DashboardAreaChart
        title={areaChartTitle}
        description="Cumulative user growth over time"
        data={userChartData}
        isLoading={isLoading}
        color="#22c55e"
        dataKey="count"
        yAxisLabel="Users"
      />

      {/* User Registration Bar Chart */}
      <DashboardBarChart
        title={barChartTitle}
        description="New user registrations by date"
        data={userChartData}
        isLoading={isLoading}
        dataKey="count"
        nameKey="formattedDate"
        color="#3b82f6"
      />
    </div>
  )
}
