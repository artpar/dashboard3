import React, { useState, useEffect, useMemo } from 'react'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { useEntityDistributionData, DashboardPieChart, DashboardBarChart } from './DataCharts'
import { getEntityColor } from '../utils/dashboardUtils'

interface EntityDistributionProps {
  maxEntities?: number
  layout?: 'horizontal' | 'vertical'
}

export const EntityDistribution: React.FC<EntityDistributionProps> = ({
  maxEntities = 10,
  layout = 'vertical'
}) => {
  // Get entities from the world entities hook
  const { entities, groupedEntities, isLoading: isLoadingEntities } = useWorldEntities()
  
  // Filter to get top-level entities that aren't system tables
  const topLevelEntities = useMemo(() => {
    if (!groupedEntities || !groupedEntities.topLevel) return []
    
    return groupedEntities.topLevel
      .filter(entity => !entity.table_name.startsWith('_') && entity.table_name.indexOf('_has_') === -1)
      .slice(0, maxEntities)
  }, [groupedEntities, maxEntities])
  
  // Get entity names for the query
  const entityNames = useMemo(() => {
    return topLevelEntities.map(entity => entity.table_name)
  }, [topLevelEntities])
  
  // Fetch entity distribution data using the sequential aggregate endpoint
  const { data: entityCounts, isLoading: isLoadingCounts } = useEntityDistributionData(entityNames)
  
  // Process data for charts
  const chartData = useMemo(() => {
    if (!entityCounts || !topLevelEntities) return []
    
    return topLevelEntities
      .map(entity => ({
        entityName: entity.table_name,
        count: entityCounts[entity.table_name] || 0,
        color: getEntityColor(entity.table_name)
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [entityCounts, topLevelEntities])
  
  const isLoading = isLoadingEntities || isLoadingCounts
  
  return (
    <div className="space-y-6">
      {/* Entity Distribution Bar Chart */}
      <DashboardBarChart
        title="Entity Distribution"
        description="Distribution of records across entity types"
        data={chartData}
        isLoading={isLoading}
        dataKey="count"
        nameKey="entityName"
        color="#3b82f6"
        layout={layout}
      />
      
      {/* Entity Distribution Pie Chart */}
      <DashboardPieChart
        title="Entity Distribution"
        description="Distribution of records across entity types"
        data={chartData}
        isLoading={isLoading}
      />
    </div>
  )
}
