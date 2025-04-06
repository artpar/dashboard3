import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SystemOverviewProps {
  className?: string
}

export function SystemOverview({ className }: SystemOverviewProps) {
  const [activeTab, setActiveTab] = useState('usage')

  // Simulated data - in a real app, this would come from an API
  const resourceUsageData = [
    {
      name: 'Jan',
      user_account: 120,
      memory: 400,
      article: 240,
      cloud_store: 180,
    },
    {
      name: 'Feb',
      user_account: 140,
      memory: 450,
      article: 260,
      cloud_store: 200,
    },
    {
      name: 'Mar',
      user_account: 170,
      memory: 490,
      article: 290,
      cloud_store: 230,
    },
    {
      name: 'Apr',
      user_account: 200,
      memory: 520,
      article: 340,
      cloud_store: 270,
    },
    {
      name: 'May',
      user_account: 250,
      memory: 550,
      article: 380,
      cloud_store: 300,
    },
    {
      name: 'Jun',
      user_account: 280,
      memory: 590,
      article: 430,
      cloud_store: 340,
    },
  ]

  const requestData = [
    { name: 'Sun', requests: 120 },
    { name: 'Mon', requests: 240 },
    { name: 'Tue', requests: 320 },
    { name: 'Wed', requests: 180 },
    { name: 'Thu', requests: 270 },
    { name: 'Fri', requests: 390 },
    { name: 'Sat', requests: 250 },
  ]

  const topResourcesData = [
    { name: 'user_account', value: 3200 },
    { name: 'memory', value: 2800 },
    { name: 'article', value: 1950 },
    { name: 'cloud_store', value: 1800 },
    { name: 'workgroup', value: 1600 },
  ]

  return (
    <Card className={cn('col-span-4', className)}>
      <CardHeader>
        <CardTitle>System Overview</CardTitle>
        <CardDescription>
          Monitor resource usage and API activity
        </CardDescription>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='mt-2'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='usage'>Resource Usage</TabsTrigger>
            <TabsTrigger value='requests'>API Requests</TabsTrigger>
            <TabsTrigger value='top'>Top Resources</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className='h-[300px]'>
          {activeTab === 'usage' && (
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart
                data={resourceUsageData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Line
                  type='monotone'
                  dataKey='user_account'
                  stroke='#8884d8'
                  name='User Accounts'
                />
                <Line
                  type='monotone'
                  dataKey='memory'
                  stroke='#82ca9d'
                  name='Memories'
                />
                <Line
                  type='monotone'
                  dataKey='article'
                  stroke='#ffc658'
                  name='Articles'
                />
                <Line
                  type='monotone'
                  dataKey='cloud_store'
                  stroke='#ff8042'
                  name='Cloud Storage'
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'requests' && (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={requestData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='name' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='requests' fill='#8884d8' name='API Requests' />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === 'top' && (
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                layout='vertical'
                data={topResourcesData}
                margin={{ top: 5, right: 10, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis type='number' />
                <YAxis dataKey='name' type='category' />
                <Tooltip />
                <Bar dataKey='value' fill='#82ca9d' name='Records' />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
