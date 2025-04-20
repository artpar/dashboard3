import React, { useState, useCallback, memo } from 'react'
import { useEntityActions } from '../../hooks/useEntityActions'
import { Button } from '@/components/ui/button'
import { Loader2, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import EntityActionDialog from './EntityActionDialog'
import EntityActionResponseViewer from './EntityActionResponseViewer'

interface EntityActionsPanelProps {
  entityName: string
  entityId?: string
  onActionComplete?: () => void
}

// Create a memoized action card component to prevent unnecessary re-renders
const ActionCard = memo(({
                           action,
                           actionInProgress,
                           onSelectAction
                         }: {
  action: any,
  actionInProgress: string | null,
  onSelectAction: (name: string) => void
}) => {
  // Use callback to prevent new function creation on each render
  const handleClick = useCallback(() => {
    onSelectAction(action.ActionName)
  }, [action.ActionName, onSelectAction])

  return (
    <Card key={action.ActionName} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{action.ActionName}</CardTitle>
        <CardDescription>
          {action.InstanceOptional
            ? 'Entity-level action'
            : 'Instance-specific action'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {action.InFields && action.InFields.length > 0
              ? `${action.InFields.length} input field${action.InFields.length !== 1 ? 's' : ''}`
              : 'No input required'}
          </div>
          <Button
            size="sm"
            onClick={handleClick}
            disabled={!!actionInProgress}
          >
            {actionInProgress === action.ActionName ? (
              <React.Fragment key="loading">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </React.Fragment>
            ) : (
              <React.Fragment key="execute">
                <PlayCircle className="mr-2 h-4 w-4" />
                Execute
              </React.Fragment>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

export const EntityActionsPanel: React.FC<EntityActionsPanelProps> = ({
                                                                        entityName,
                                                                        entityId,
                                                                        onActionComplete,
                                                                      }) => {
  const [selectedActionName, setSelectedActionName] = useState<string | null>(null)

  const {
    actions,
    isLoading,
    error,
    executeAction,
    actionInProgress,
    actionResponses,
  } = useEntityActions({ entityName, entityId })

  // Find the selected action object - memoize to prevent recalculations
  const selectedAction = React.useMemo(() =>
      actions?.find(action => action.ActionName === selectedActionName),
    [actions, selectedActionName]
  )

  // Handle action execution with useCallback to prevent function recreation
  const handleExecuteAction = useCallback(async (actionName: string, payload: Record<string, any>) => {
    try {
      await executeAction(actionName, payload)
      if (onActionComplete) {
        onActionComplete()
      }
    } catch (err) {
      console.error('Error executing action:', err)
    }
  }, [executeAction, onActionComplete])

  // Handle closing dialog
  const handleCloseDialog = useCallback(() => {
    setSelectedActionName(null)
  }, [])

  // Handle selecting an action
  const handleSelectAction = useCallback((actionName: string) => {
    setSelectedActionName(actionName)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Actions</CardTitle>
          <CardDescription>
            There was a problem loading actions for this entity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!actions || actions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Actions Available</CardTitle>
          <CardDescription>
            There are no actions defined for this entity{entityId ? ' instance' : ''}.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Filter actions that are not instance optional only once
  const filteredActions = actions.filter(e => !e.InstanceOptional)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActions.map((action) => (
          <ActionCard
            key={action.ActionName}
            action={action}
            actionInProgress={actionInProgress}
            onSelectAction={handleSelectAction}
          />
        ))}
      </div>

      {/* Action dialog */}
      {selectedAction && (
        <EntityActionDialog
          action={selectedAction}
          isOpen={!!selectedActionName}
          isLoading={actionInProgress === selectedActionName}
          onClose={handleCloseDialog}
          onExecute={handleExecuteAction}
        />
      )}

      {/* Display action responses if available */}
      {selectedActionName && actionResponses[selectedActionName] && (
        <EntityActionResponseViewer
          responses={actionResponses[selectedActionName]}
          actionName={selectedActionName}
        />
      )}
    </div>
  )
}

export default EntityActionsPanel
