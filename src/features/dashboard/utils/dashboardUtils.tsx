import { format, subDays } from 'date-fns'
import {
  Users,
  Database,
  Lightbulb,
  FileText,
  ClipboardList,
  Layers,
  Mail,
  Calendar,
  Globe,
  Shield,
  Key,
  Cloud,
  Server
} from 'lucide-react'
import React from 'react'

// Interface for aggregate data from API
export interface AggregateData {
  id: string
  type: string
  attributes: {
    __type: string
    count: number
    date: string
    max: string
    min: string
  }
}

// Interface for chart data
export interface ChartData {
  date: string
  count: number
  formattedDate: string
}

// Interface for entity distribution data
export interface EntityDistributionData {
  entityName: string
  count: number
  color: string
}

// Interface for entity statistics
export interface EntityStats {
  entityName: string
  count: number
  icon: React.ReactNode
  description: string
  path: string
  isLoading: boolean
  color: string
}

/**
 * Process aggregate data into chart format for daily counts
 */
export const processChartData = (
  aggregateData: AggregateData[] | undefined,
  dateFormat: string = 'MMM dd'
): ChartData[] => {
  if (!aggregateData || aggregateData.length === 0) {
    return generateEmptyChartData()
  }

  // Sort by date
  const sortedData = [...aggregateData].sort((a, b) => {
    return new Date(a.attributes.date).getTime() - new Date(b.attributes.date).getTime()
  })

  return sortedData.map(item => ({
    date: item.attributes.date,
    count: item.attributes.count,
    formattedDate: format(new Date(item.attributes["date(created_at)"]), dateFormat),
  }))
}

/**
 * Process aggregate data into cumulative chart format
 */
export const processCumulativeChartData = (
  aggregateData: AggregateData[] | undefined,
  dateFormat: string = 'MMM dd'
): ChartData[] => {
  if (!aggregateData || aggregateData.length === 0) {
    return generateEmptyChartData()
  }

  // Sort by date
  const sortedData = [...aggregateData].sort((a, b) => {
    return new Date(a.attributes.date).getTime() - new Date(b.attributes.date).getTime()
  })

  let cumulativeCount = 0;

  return sortedData.map(item => {
    cumulativeCount += item.attributes.count;
    return {
      date: item.attributes.date,
      count: cumulativeCount,
      formattedDate: format(new Date(item.attributes["date(created_at)"]), dateFormat),
    };
  })
}

/**
 * Generate empty chart data for loading state
 */
export const generateEmptyChartData = (days: number = 30): ChartData[] => {
  const data: ChartData[] = []
  const today = new Date()

  for (let i = days; i >= 0; i--) {
    const date = subDays(today, i)
    data.push({
      date: date.toISOString(),
      count: 0,
      formattedDate: format(date, 'MMM dd'),
    })
  }

  return data
}

/**
 * Get icon for entity
 */
export const getEntityIcon = (entityName: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    user_account: <Users className="text-blue-500 h-6 w-6" />,
    usergroup: <Users className="text-indigo-500 h-6 w-6" />,
    memory: <Lightbulb className="text-yellow-500 h-6 w-6" />,
    document: <FileText className="text-green-500 h-6 w-6" />,
    task: <ClipboardList className="text-purple-500 h-6 w-6" />,
    workgroup: <Layers className="text-orange-500 h-6 w-6" />,
    mail: <Mail className="text-red-500 h-6 w-6" />,
    calendar: <Calendar className="text-cyan-500 h-6 w-6" />,
    site: <Globe className="text-emerald-500 h-6 w-6" />,
    certificate: <Shield className="text-pink-500 h-6 w-6" />,
    credential: <Key className="text-amber-500 h-6 w-6" />,
    cloud_store: <Cloud className="text-sky-500 h-6 w-6" />,
    mail_server: <Server className="text-rose-500 h-6 w-6" />,
  }

  return iconMap[entityName] || <Database className="text-gray-500 h-6 w-6" />
}

/**
 * Get color for entity
 */
export const getEntityColor = (entityName: string): string => {
  const colorMap: Record<string, string> = {
    user_account: '#3b82f6', // blue-500
    usergroup: '#6366f1', // indigo-500
    memory: '#eab308', // yellow-500
    document: '#22c55e', // green-500
    task: '#a855f7', // purple-500
    workgroup: '#f97316', // orange-500
    mail: '#ef4444', // red-500
    calendar: '#06b6d4', // cyan-500
    site: '#10b981', // emerald-500
    certificate: '#ec4899', // pink-500
    credential: '#f59e0b', // amber-500
    cloud_store: '#0ea5e9', // sky-500
    mail_server: '#f43f5e', // rose-500
  }

  return colorMap[entityName] || '#6b7280' // gray-500
}

/**
 * Calculate total from aggregate data
 */
export const calculateTotalFromAggregates = (aggregateData: AggregateData[] | undefined): number => {
  if (!aggregateData) return 0
  return aggregateData.reduce((total, item) => total + item.attributes.count, 0)
}

/**
 * Format entity name for display
 */
export const formatEntityName = (entityName: string): string => {
  return entityName.replace(/_/g, ' ')
}
