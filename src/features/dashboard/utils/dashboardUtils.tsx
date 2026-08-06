import React from 'react'
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
  Server,
} from 'lucide-react'

// Interface for aggregate data from API
export interface AggregateData {
  id: string
  type: string
  attributes: {
    __type: string
    count: number
    day?: string
    date?: string
    'date(created_at)'?: string
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

  const validData = aggregateData
    .map((item) => ({
      item,
      date:
        item.attributes.day ||
        item.attributes['date(created_at)'] ||
        item.attributes.date,
    }))
    .filter(({ date }) => date && !Number.isNaN(new Date(date).getTime()))
    .sort(
      ({ date: a }, { date: b }) =>
        new Date(a!).getTime() - new Date(b!).getTime()
    )

  if (!validData.length) {
    return generateEmptyChartData()
  }

  return validData.map(({ item, date }) => ({
    date: date!,
    count: item.attributes.count,
    formattedDate: format(new Date(date!), dateFormat),
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

  const validData = aggregateData
    .map((item) => ({
      item,
      date:
        item.attributes.day ||
        item.attributes['date(created_at)'] ||
        item.attributes.date,
    }))
    .filter(({ date }) => date && !Number.isNaN(new Date(date).getTime()))
    .sort(
      ({ date: a }, { date: b }) =>
        new Date(a!).getTime() - new Date(b!).getTime()
    )

  if (!validData.length) {
    return generateEmptyChartData()
  }

  let cumulativeCount = 0

  return validData.map(({ item, date }) => {
    cumulativeCount += item.attributes.count
    return {
      date: date!,
      count: cumulativeCount,
      formattedDate: format(new Date(date!), dateFormat),
    }
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
    user_account: <Users className='h-6 w-6 text-blue-500' />,
    usergroup: <Users className='h-6 w-6 text-indigo-500' />,
    memory: <Lightbulb className='h-6 w-6 text-yellow-500' />,
    document: <FileText className='h-6 w-6 text-green-500' />,
    task: <ClipboardList className='h-6 w-6 text-purple-500' />,
    workgroup: <Layers className='h-6 w-6 text-orange-500' />,
    mail: <Mail className='h-6 w-6 text-red-500' />,
    calendar: <Calendar className='h-6 w-6 text-cyan-500' />,
    site: <Globe className='h-6 w-6 text-emerald-500' />,
    certificate: <Shield className='h-6 w-6 text-pink-500' />,
    credential: <Key className='h-6 w-6 text-amber-500' />,
    cloud_store: <Cloud className='h-6 w-6 text-sky-500' />,
    mail_server: <Server className='h-6 w-6 text-rose-500' />,
  }

  return iconMap[entityName] || <Database className='h-6 w-6 text-gray-500' />
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
export const calculateTotalFromAggregates = (
  aggregateData: AggregateData[] | undefined
): number => {
  if (!aggregateData) return 0
  return aggregateData.reduce((total, item) => total + item.attributes.count, 0)
}

/**
 * Format entity name for display
 */
export const formatEntityName = (entityName: string): string => {
  return entityName.replace(/_/g, ' ')
}
