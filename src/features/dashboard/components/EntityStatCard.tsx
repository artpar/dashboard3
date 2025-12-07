import React from 'react'
import { Database } from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@tanstack/react-router'

interface EntityStatCardProps {
  entityName: string
  count: number
  icon: React.ReactNode
  description: string
  path: string
  isLoading: boolean
}

export const EntityStatCard: React.FC<EntityStatCardProps> = ({
  entityName,
  count,
  icon,
  description,
  path,
  isLoading,
}) => {

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="capitalize text-sm font-medium">
          {entityName.replace(/_/g, ' ')}
        </CardTitle>
        {icon || <Database className="text-gray-500 h-6 w-6" />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{count}</div>
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          {description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" className="w-full" asChild>
          <Link to={path}>View All</Link>
        </Button>
        <Button variant="outline" className="ml-2" asChild>
          <Link to={`${path}/new`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
