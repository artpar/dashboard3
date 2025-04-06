import React, { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { sendMessageToBackgroundScript } from '@/background'
import {
  ClipboardList,
  CreditCard,
  FileText,
  Lightbulb,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const Dashboard = () => {
  const { user, customer, creator } = useAuthStore()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    memories: 0,
    articles: 0,
    workgroups: 0,
    replies: 0,
    upvotes: 0,
    tasks: 0,
  })

  const [chartData, setChartData] = useState([])
  const [recentMemories, setRecentMemories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // Fetch memories count
        const memoriesResponse = await sendMessageToBackgroundScript({
          type: 'getAllMemories',
        })

        // Fetch workgroups
        const workgroupsResponse = await sendMessageToBackgroundScript({
          type: 'getWorkgroups',
        })

        // Fetch tasks
        const tasksResponse = await sendMessageToBackgroundScript({
          type: 'getAllTask',
        })

        // Set stats
        setStats({
          memories: memoriesResponse?.length || 0,
          workgroups: workgroupsResponse?.data?.length || 0,
          tasks: tasksResponse?.length || 0,
          articles: 0, // Will implement when we add article fetching
          replies: 0,
          upvotes: 0,
        })

        // Set recent memories for display
        setRecentMemories(
          memoriesResponse?.slice(0, 5).map((memory) => ({
            id: memory.reference_id,
            title: memory.title,
            type: memory.memory_type,
            createdAt: new Date(memory.created_at).toLocaleDateString(),
          })) || []
        )

        // Generate sample chart data based on tasks
        if (tasksResponse?.length) {
          const tasksByDate = {}
          tasksResponse.forEach((task) => {
            const date = new Date(task.created_at).toLocaleDateString()
            tasksByDate[date] = (tasksByDate[date] || 0) + 1
          })

          const chartPoints = Object.keys(tasksByDate).map((date) => ({
            date,
            count: tasksByDate[date],
          }))

          // Sort by date
          chartPoints.sort((a, b) => new Date(a.date) - new Date(b.date))

          setChartData(chartPoints)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const entityCards = [
    {
      title: 'Memories',
      description: 'Manage workflow memories',
      icon: <Lightbulb className='text-primary h-6 w-6' />,
      count: stats.memories,
      path: '/memories',
    },
    {
      title: 'Workgroups',
      description: 'Manage team workgroups',
      icon: <Users className='text-primary h-6 w-6' />,
      count: stats.workgroups,
      path: '/workgroups',
    },
    {
      title: 'Articles',
      description: 'Manage content articles',
      icon: <FileText className='text-primary h-6 w-6' />,
      count: stats.articles,
      path: '/articles',
    },
    {
      title: 'Tasks',
      description: 'Manage automation tasks',
      icon: <ClipboardList className='text-primary h-6 w-6' />,
      count: stats.tasks,
      path: '/tasks',
    },
    {
      title: 'Replies',
      description: 'Manage content replies',
      icon: <MessageSquare className='text-primary h-6 w-6' />,
      count: stats.replies,
      path: '/replies',
    },
    {
      title: 'Payments',
      description: 'Manage subscription payments',
      icon: <CreditCard className='text-primary h-6 w-6' />,
      count: '-',
      path: '/payments',
    },
  ]

  return (
    <div className='space-y-6'>
      {/* User welcome section */}
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-2xl'>
            Welcome,{' '}
            {creator?.creator_name ||
              customer?.customer_name ||
              user?.name ||
              'User'}
          </CardTitle>
          <CardDescription>
            Dashboard overview of your 100x Bot account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-sm font-medium'>Credits</p>
              <p className='text-2xl font-bold'>{customer?.credit || 0}</p>
            </div>
            <div>
              <p className='text-sm font-medium'>Referral Code</p>
              <p className='text-muted-foreground text-xl font-medium'>
                {customer?.referral_code || 'No referral code'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {entityCards.map((card, index) => (
          <Card key={index} className='transition-shadow hover:shadow-md'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                {card.title}
              </CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {isLoading ? '...' : card.count}
              </div>
              <p className='text-muted-foreground mt-1 text-xs'>
                {card.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => navigate({ to: card.path })}
              >
                View All
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Activity chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
          <CardDescription>Task activity in the past week</CardDescription>
        </CardHeader>
        <CardContent className='h-80'>
          {isLoading ? (
            <div className='flex h-full items-center justify-center'>
              <p>Loading chart data...</p>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#8884d8'
                  strokeWidth={2}
                  name='Tasks'
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className='text-muted-foreground flex h-full items-center justify-center'>
              <p>No activity data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent memories */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Recent Memories</CardTitle>
            <CardDescription>
              Your recently created workflow memories
            </CardDescription>
          </div>
          <Button
            variant='outline'
            onClick={() => navigate({ to: '/memories' })}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading recent memories...</p>
          ) : recentMemories.length > 0 ? (
            <div className='space-y-4'>
              {recentMemories.map((memory) => (
                <div
                  key={memory.id}
                  className='flex items-center justify-between border-b pb-2'
                >
                  <div>
                    <p className='font-medium'>{memory.title}</p>
                    <p className='text-muted-foreground text-sm'>
                      Created on {memory.createdAt}
                    </p>
                  </div>
                  <Badge variant='outline'>{memory.type}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground'>No recent memories found.</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <Button
              variant='outline'
              className='flex h-24 flex-col space-y-2'
              onClick={() => navigate({ to: '/memories/new' })}
            >
              <Lightbulb className='h-6 w-6' />
              <span>New Memory</span>
            </Button>
            <Button
              variant='outline'
              className='flex h-24 flex-col space-y-2'
              onClick={() => navigate({ to: '/articles/new' })}
            >
              <FileText className='h-6 w-6' />
              <span>New Article</span>
            </Button>
            <Button
              variant='outline'
              className='flex h-24 flex-col space-y-2'
              onClick={() => navigate({ to: '/tasks/new' })}
            >
              <ClipboardList className='h-6 w-6' />
              <span>New Task</span>
            </Button>
            <Button
              variant='outline'
              className='flex h-24 flex-col space-y-2'
              onClick={() => navigate({ to: '/settings/account' })}
            >
              <Settings className='h-6 w-6' />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
