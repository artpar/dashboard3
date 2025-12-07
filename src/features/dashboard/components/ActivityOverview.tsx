import React from 'react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { format, parseISO } from 'date-fns'

interface ActivityOverviewProps {
  entityName: string
  items: any[]
  icon: React.ReactNode
}

export const ActivityOverview: React.FC<ActivityOverviewProps> = ({
  entityName,
  items,
  icon,
}) => {

  // Function to get the most appropriate display name for an item
  const getItemDisplayName = (item: any): string => {
    if (!item) return 'Unknown'
    
    // Try to find the best property to display
    return (
      item.name ||
      item.title ||
      item.label ||
      item.email ||
      item.document_name ||
      item.stream_name ||
      item.table_name ||
      item.action_name ||
      item.hostname ||
      (item.reference_id ? item.reference_id.substring(0, 8) : 'Unknown')
    )
  }

  // Function to get the formatted date for an item
  const getItemDate = (item: any): string => {
    try {
      if (item.created_at) {
        return format(parseISO(item.created_at), 'MMM dd, yyyy HH:mm')
      }
      if (item.updated_at) {
        return format(parseISO(item.updated_at), 'MMM dd, yyyy HH:mm')
      }
    } catch (error) {
      console.error('Error formatting date:', error)
    }
    return ''
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize text-base">
            Recent {entityName.replace(/_/g, ' ')}
          </CardTitle>
          {icon}
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
                className="flex flex-col rounded-md border p-2 text-sm hover:bg-muted"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[180px]">
                    {getItemDisplayName(item)}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/${entityName}/${item.reference_id}`}>
                      View
                    </Link>
                  </Button>
                </div>
                {getItemDate(item) && (
                  <span className="text-muted-foreground text-xs mt-1">
                    {getItemDate(item)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link to={`/${entityName}`}>View All</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
