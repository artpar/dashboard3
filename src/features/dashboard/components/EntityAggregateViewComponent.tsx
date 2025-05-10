import React, { useMemo } from 'react'
import { DashboardAreaChart, DashboardBarChart, useEntityAggregateData } from './DataCharts'
import { processChartData, processCumulativeChartData } from '../utils/dashboardUtils'

interface UserGrowthProps {
  areaChartTitle?: string
  entityName?: string
  className?: string
  barChartTitle?: string
}

export const EntityAggregateViewComponent: React.FC<UserGrowthProps> = ({
                                                                          entityName = 'user_account',
                                                                          className = '',
                                                                          areaChartTitle = entityName + ' Growth Trend',
                                                                          barChartTitle = entityName + ' Activity',
                                                                        }) => {
  // Fetch user aggregate data using the aggregate endpoint
  const { data: userAggregateData, isLoading } = useEntityAggregateData(entityName, 'date(created_at)')

  // Process regular chart data for bar chart (new registrations by date)
  const dailyChartData = useMemo(() => {
    return processChartData(userAggregateData)
  }, [userAggregateData])

  // Process cumulative chart data for area chart (cumulative growth)
  const cumulativeChartData = useMemo(() => {
    return processCumulativeChartData(userAggregateData)
  }, [userAggregateData])

  return (
    <div className={className + ' grid grid-cols-1 gap-4 md:grid-cols-2'}>
      {/* User Growth Area Chart - Cumulative */}
      <DashboardAreaChart
        title={areaChartTitle}
        description={'Cumulative ' + entityName + ' growth over time'}
        data={cumulativeChartData}
        isLoading={isLoading}
        color="#22c55e"
        dataKey="count"
        yAxisLabel={entityName}
      />

      {/* User Registration Bar Chart - Daily */}
      <DashboardBarChart
        title={barChartTitle}
        description={'New ' + entityName + ' by date'}
        data={dailyChartData}
        isLoading={isLoading}
        dataKey="count"
        nameKey="formattedDate"
        color="#3b82f6"
      />
    </div>
  )
}
