import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Database, Users, FileCode, Share2 } from 'lucide-react'

interface SystemStats {
  resources: number
  users: number
  actions: number
  integrations: number
}

interface StatusCardsProps {
  isLoading: boolean
  stats: SystemStats
}

export function StatusCards({ isLoading, stats }: StatusCardsProps) {
  const cards = [
    {
      title: 'Data Resources',
      value: stats.resources,
      icon: <Database className="h-5 w-5 text-primary" />,
      description: 'Tables & entities',
    },
    {
      title: 'Users',
      value: stats.users,
      icon: <Users className="h-5 w-5 text-blue-500" />,
      description: 'Accounts registered',
    },
    {
      title: 'Actions',
      value: stats.actions,
      icon: <FileCode className="h-5 w-5 text-amber-500" />,
      description: 'Workflows defined',
    },
    {
      title: 'Integrations',
      value: stats.integrations,
      icon: <Share2 className="h-5 w-5 text-green-500" />,
      description: 'External connections',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
