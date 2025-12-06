import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Play, Info, AlertCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { daptinClient } from '@/daptin'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface EntityAction {
  entityName: string
  actionName: string
  label: string
  instanceOptional: boolean
  referenceId: string
}

export const EntityActions: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [actions, setActions] = useState<EntityAction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch available actions
  useEffect(() => {
    const fetchActions = async () => {
      try {
        setIsLoading(true)
        const response = await daptinClient.jsonApi.findAll('action', {
          'page[size]': '500',
          sort: 'action_name',
          included_relations: "world_id"
        })

        if (response.data) {
          // Process and filter actions
          const actionsList = response.data
            .filter((action: any) =>
              // Filter out system actions or actions that are not useful for dashboard
              !action.action_name.startsWith('_') &&
              !action.action_name.includes('oauth') &&
              action.instance_optional
            )
            .slice(0, 12) // Limit to 12 actions for display
            .map((action: any) => ({
              entityName: action.world_id.table_name,
              actionName: action.action_name,
              label: action.label || action.action_name.replace(/_/g, ' '),
              instanceOptional: action.instance_optional,
              referenceId: action.reference_id,
            }))

          setActions(actionsList)
        }
      } catch (error) {
        console.error('Error fetching actions:', error)
        toast({
          title: 'Error',
          description: 'Failed to load available actions',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchActions()
  }, [toast])

  // Navigate to action execution page
  const navigateToAction = (action: EntityAction) => {
    if (action.instanceOptional) {
      navigate({ to: `/${action.entityName}/actions/${action.actionName}` })
    } else {
      navigate({ to: `/${action.entityName}` })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Actions</CardTitle>
        <CardDescription>
          Common system actions you can execute
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : actions.length === 0 ? (
          <div className="flex items-center justify-center p-4 text-center">
            <div>
              <AlertCircle className="mx-auto h-8 w-8 text-yellow-500" />
              <p className="mt-2 text-sm">No actions available</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <TooltipProvider key={action.ReferenceId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-between w-full"
                      onClick={() => navigateToAction(action)}
                    >
                      <span className="truncate mr-2">{action.label}</span>
                      <div className="flex items-center">
                        <Play className="h-4 w-4" />
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Execute {action.actionName} on {action.entityName}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
