import React, { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { daptinClient } from '@/daptin'
import { useQuery } from '@tanstack/react-query'
import { processChartData, generateEmptyChartData } from '../utils/dashboardUtils.tsx'

// Chart data interfaces
export interface ChartData {
  date: string
  count: number
  formattedDate: string
}

export interface EntityDistributionData {
  entityName: string
  count: number
  color: string
}

// Aggregate data interface
export interface AggregateResult {
  id: string
  type: string
  attributes: {
    __type: string
    count: number
    date?: string
    max?: string
    min?: string
    [key: string]: any
  }
}

// Hook for fetching entity data with aggregate endpoint
export const useEntityAggregateData = (entityName: string, groupByField: string = 'date(created_at)') => {
  return useQuery({
    queryKey: [`${entityName}-aggregates`, groupByField],
    queryFn: async () => {
      try {
        const result = await daptinClient.aggregateClient
          .entity(entityName)
          .groupBy(groupByField)
          .count()
          .max(groupByField)
          .min(groupByField)
          .execute()

        return result as AggregateResult[]
      } catch (error) {
        console.error(`Failed to fetch ${entityName} aggregates:`, error)
        return []
      }
    },
  })
}

// Custom hook for entity distribution data with sequential fetching
export const useEntityDistributionData = (entityNames: string[]) => {
  const [results, setResults] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (!entityNames.length) {
      setResults({})
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    // Initialize with empty results
    const initialResults: Record<string, number> = {}
    entityNames.forEach(name => {
      initialResults[name] = 0
    })
    setResults(initialResults)
    
    // Sequential fetching function
    const fetchSequentially = async () => {
      for (const entityName of entityNames) {
        try {
          const result = await daptinClient.aggregateClient
            .entity(entityName)
            .count()
            .execute()
          
          // Update the results for this entity
          setResults(prev => ({
            ...prev,
            [entityName]: result && result.length > 0 ? result[0].attributes.count : 0
          }))
        } catch (error) {
          console.error(`Failed to fetch count for ${entityName}:`, error)
          // Don't update error state, just log it and continue
        }
      }
      
      setIsLoading(false)
    }
    
    fetchSequentially().catch(err => {
      console.error('Failed to fetch entity distribution:', err)
      setError(err instanceof Error ? err : new Error(String(err)))
      setIsLoading(false)
    })
  }, [entityNames.join(',')])
  
  return { data: results, isLoading, error }
}

interface AreaChartProps {
  title: string
  description: string
  data: ChartData[]
  isLoading: boolean
  color?: string
  dataKey?: string
  yAxisLabel?: string
}

interface BarChartProps {
  title: string
  description: string
  data: any[]
  isLoading: boolean
  dataKey: string
  nameKey: string
  color?: string
  layout?: 'horizontal' | 'vertical'
}

interface PieChartProps {
  title: string
  description: string
  data: EntityDistributionData[]
  isLoading: boolean
}

// Area Chart Component
export const DashboardAreaChart: React.FC<AreaChartProps> = ({
  title,
  description,
  data,
  isLoading,
  color = '#3b82f6',
  dataKey = 'count',
  yAxisLabel = 'Count',
}) => {
  const gradientId = `color${dataKey}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value: number) => [`${value}`, yAxisLabel]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Bar Chart Component
export const DashboardBarChart: React.FC<BarChartProps> = ({
  title,
  description,
  data,
  isLoading,
  dataKey,
  nameKey,
  color = '#3b82f6',
  layout = 'horizontal',
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout={layout}
                margin={
                  layout === 'vertical'
                    ? { top: 10, right: 30, left: 50, bottom: 0 }
                    : { top: 10, right: 30, left: 0, bottom: 20 }
                }
              >
                {layout === 'vertical' ? (
                  <>
                    <XAxis type="number" />
                    <YAxis
                      dataKey={nameKey}
                      type="category"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => 
                        typeof value === 'string' ? value.replace(/_/g, ' ') : value
                      }
                    />
                  </>
                ) : (
                  <>
                    <XAxis
                      dataKey={nameKey}
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => 
                        typeof value === 'string' ? value.replace(/_/g, ' ') : value
                      }
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                  </>
                )}
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value: number) => [`${value}`, 'Count']}
                  labelFormatter={(label) => 
                    `Entity: ${typeof label === 'string' ? label.replace(/_/g, ' ') : label}`
                  }
                />
                <Bar
                  dataKey={dataKey}
                  fill={color}
                  radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Pie Chart Component
export const DashboardPieChart: React.FC<PieChartProps> = ({
  title,
  description,
  data,
  isLoading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="entityName"
                  label={({ name, percent }) => 
                    `${name.replace(/_/g, ' ')}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} records`, 'Count']}
                  labelFormatter={(label) => `Entity: ${label.replace(/_/g, ' ')}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
