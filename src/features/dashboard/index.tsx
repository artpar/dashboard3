import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  BarChart,
  Calendar,
  ClipboardList,
  FileText,
  Lightbulb,
  PlusCircle,
  Settings,
  Users,
  Database,
  Activity,
  Layers,
  LayoutDashboard,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useWorldEntities } from '@/hooks/use-world-entities'
import { daptinClient } from '@/daptin'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts'
import { format, subDays, parseISO } from 'date-fns'

// Type definitions
interface EntityStats {
  entityName: string
  count: number
  icon: React.ReactNode
  description: string
  path: string
  isLoading: boolean
}

interface AggregateData {
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

interface ChartData {
  date: string
  count: number
  formattedDate: string
}

const Dashboard = () => {
  const { user, customer, creator } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { entities, groupedEntities, isLoading: isLoadingEntities } = useWorldEntities()

  const [activeTab, setActiveTab] = useState('overview')
  const [entityStats, setEntityStats] = useState<EntityStats[]>([])
  const [totalEntities, setTotalEntities] = useState(0)
  const [recentActivity, setRecentActivity] = useState<Record<string, any[]>>({})

  // Get user aggregate data
  const { data: userAggregateData, isLoading: isLoadingUserAggregates } = useQuery({
    queryKey: ['user-aggregates'],
    queryFn: async () => {
      try {
        const result = await daptinClient.aggregateClient
          .entity('user_account')
          .groupBy('date(created_at)')
          .count()
          .max('date(created_at)')
          .min('date(created_at)')
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
        .filter(entity => !entity.table_name.startsWith('_'))
        .slice(0, 6) // Limit to 6 entities for display

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
          })

          // Fetch count for this entity
          const response = await daptinClient.jsonApi.findAll(entity.table_name, {
            'page[size]': '1',
          })

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
        .filter(entity => !entity.table_name.startsWith('_'))
        .slice(0, 4) // Limit to 4 entities for recent activity

      const activity: Record<string, any[]> = {}

      for (const entity of activityEntities) {
        try {
          const response = await daptinClient.jsonApi.findAll(entity.table_name, {
            'page[size]': '5',
            sort: '-created_at',
          })

          if (response && response.data) {
            activity[entity.table_name] = response.data
          }
        } catch (error) {
          console.error(`Error fetching recent activity for ${entity.table_name}:`, error)
        }
      }

      setRecentActivity(activity)
    }

    fetchRecentActivity()
  }, [entities, groupedEntities])

  // Process user aggregate data for charts
  const processUserChartData = (): ChartData[] => {
    if (!userAggregateData || userAggregateData.length === 0) {
      return generateEmptyChartData()
    }

    // Sort by date
    const sortedData = [...userAggregateData].sort((a, b) => {
      return new Date(a.attributes.date).getTime() - new Date(b.attributes.date).getTime()
    })

    return sortedData.map(item => ({
      date: item.attributes.date,
      count: item.attributes.count,
      formattedDate: format(new Date(item.attributes.date), 'MMM dd'),
    }))
  }

  // Generate empty chart data for loading state
  const generateEmptyChartData = (): ChartData[] => {
    const data: ChartData[] = []
    const today = new Date()

    for (let i = 30; i >= 0; i--) {
      const date = subDays(today, i)
      data.push({
        date: date.toISOString(),
        count: 0,
        formattedDate: format(date, 'MMM dd'),
      })
    }

    return data
  }

  // Get icon for entity
  const getEntityIcon = (entityName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      user_account: <Users className="text-blue-500 h-6 w-6" />,
      usergroup: <Users className="text-indigo-500 h-6 w-6" />,
      memory: <Lightbulb className="text-yellow-500 h-6 w-6" />,
      article: <FileText className="text-green-500 h-6 w-6" />,
      rpa_task: <ClipboardList className="text-purple-500 h-6 w-6" />,
      workgroup: <Layers className="text-orange-500 h-6 w-6" />,
      customer: <Users className="text-teal-500 h-6 w-6" />,
      creator: <Users className="text-pink-500 h-6 w-6" />,
    }

    return iconMap[entityName] || <Database className="text-gray-500 h-6 w-6" />
  }

  // Get color for entity
  const getEntityColor = (entityName: string): string => {
    const colorMap: Record<string, string> = {
      user_account: '#3b82f6', // blue-500
      usergroup: '#6366f1', // indigo-500
      memory: '#eab308', // yellow-500
      article: '#22c55e', // green-500
      rpa_task: '#a855f7', // purple-500
      workgroup: '#f97316', // orange-500
      customer: '#14b8a6', // teal-500
      creator: '#ec4899', // pink-500
    }

    return colorMap[entityName] || '#6b7280' // gray-500
  }

  // Calculate total users
  const getTotalUsers = (): number => {
    if (!userAggregateData) return 0

    return userAggregateData.reduce((total, item) => total + item.attributes.count, 0)
  }

  const userChartData = processUserChartData()

  return (
    <div className="w-full space-y-6 overflow-y-auto pb-8">
      {/* User welcome section */}
        <div className="pb-2">
          <div className="text-2xl">
            Welcome,{' '}
            {creator?.creator_name ||
              customer?.customer_name ||
              user?.name ||
              'User'}
          </div>
          <div className="text-sm text-gray-500">
            Dashboard overview of your system
          </div>
        </div>
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
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Entities */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Entities
                    </CardTitle>
                    <Database className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    {isLoadingEntities ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">{totalEntities}</div>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      Across {entities.length} entity types
                    </p>
                  </CardContent>
                </Card>

                {/* Total Users */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <Users className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    {isLoadingUserAggregates ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">{getTotalUsers()}</div>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      User accounts in the system
                    </p>
                  </CardContent>
                </Card>

                {/* Credits */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Credits
                    </CardTitle>
                    <Calendar className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customer?.credit || 0}</div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Available credits
                    </p>
                  </CardContent>
                </Card>

                {/* Today's Date */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Today's Date
                    </CardTitle>
                    <Calendar className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {format(new Date(), 'MMM dd, yyyy')}
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {format(new Date(), 'EEEE')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* User Registration Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Registrations</CardTitle>
                  <CardDescription>
                    User registration trend over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUserAggregates ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={userChartData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                            formatter={(value: number) => [`${value} users`, 'Count']}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorUsers)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Button
                      variant="outline"
                      className="flex h-24 flex-col space-y-2"
                      onClick={() => navigate({ to: '/create/memory' })}
                    >
                      <Lightbulb className="h-6 w-6" />
                      <span>New Memory</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex h-24 flex-col space-y-2"
                      onClick={() => navigate({ to: '/create/article' })}
                    >
                      <FileText className="h-6 w-6" />
                      <span>New Article</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex h-24 flex-col space-y-2"
                      onClick={() => navigate({ to: '/create/rpa_task' })}
                    >
                      <ClipboardList className="h-6 w-6" />
                      <span>New Task</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex h-24 flex-col space-y-2"
                      onClick={() => navigate({ to: '/settings/account' })}
                    >
                      <Settings className="h-6 w-6" />
                      <span>Settings</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {/* Recent Activity */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(recentActivity).map(([entityName, items]) => (
                  <Card key={entityName}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="capitalize text-base">
                          Recent {entityName.replace(/_/g, ' ')}
                        </CardTitle>
                        {getEntityIcon(entityName)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {items.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No recent items</p>
                      ) : (
                        <ul className="space-y-2">
                          {items.map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted"
                            >
                              <span>
                                {item.name ||
                                 item.title ||
                                 item.label ||
                                 item.reference_id?.substring(0, 8)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate({
                                  to: `/${entityName}/${item.reference_id}`
                                })}
                              >
                                View
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate({ to: `/${entityName}` })}
                      >
                        View All
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* User Registration Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Registrations by Date</CardTitle>
                  <CardDescription>
                    Detailed view of user registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingUserAggregates ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={userChartData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <XAxis
                            dataKey="formattedDate"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip
                            formatter={(value: number) => [`${value} users`, 'Count']}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entities" className="space-y-4">
              {/* Entity Stats */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {entityStats.map((stat) => (
                  <Card key={stat.entityName} className="transition-shadow hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="capitalize text-sm font-medium">
                        {stat.entityName.replace(/_/g, ' ')}
                      </CardTitle>
                      {stat.icon}
                    </CardHeader>
                    <CardContent>
                      {stat.isLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <div className="text-2xl font-bold">{stat.count}</div>
                      )}
                      <p className="text-muted-foreground mt-1 text-xs">
                        {stat.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate({ to: stat.path })}
                      >
                        View All
                      </Button>
                      <Button
                        variant="outline"
                        className="ml-2"
                        onClick={() => navigate({ to: `${stat.path}/new` })}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Entity Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Entity Distribution</CardTitle>
                  <CardDescription>
                    Distribution of records across entity types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {entityStats.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={entityStats}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 50, bottom: 0 }}
                        >
                          <XAxis type="number" />
                          <YAxis
                            dataKey="entityName"
                            type="category"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.replace(/_/g, ' ')}
                          />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip
                            formatter={(value: number) => [`${value} records`, 'Count']}
                            labelFormatter={(label) => `Entity: ${label.replace(/_/g, ' ')}`}
                          />
                          <Bar
                            dataKey="count"
                            fill="#3b82f6"
                            radius={[0, 4, 4, 0]}
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Entities */}
              <Card>
                <CardHeader>
                  <CardTitle>All Entities</CardTitle>
                  <CardDescription>
                    Complete list of available entities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEntities ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {groupedEntities.topLevel
                        .filter(entity => !entity.table_name.startsWith('_'))
                        .map(entity => (
                          <Button
                            key={entity.table_name}
                            variant="outline"
                            className="justify-start"
                            onClick={() => navigate({ to: `/${entity.table_name}` })}
                          >
                            {getEntityIcon(entity.table_name)}
                            <span className="ml-2 capitalize">
                              {entity.table_name.replace(/_/g, ' ')}
                            </span>
                          </Button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
    </div>
  )
}

export default Dashboard
