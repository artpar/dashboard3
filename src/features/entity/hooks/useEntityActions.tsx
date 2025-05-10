import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { EntityApiService } from '../services/EntityApiService'

export interface ActionField {
  Name: string
  ColumnName: string
  ColumnType: string
  IsNullable: boolean
  DefaultValue?: string
}

export interface ActionOutcome {
  Type: string
  Method: string
  Reference?: string
  Attributes: Record<string, any>
  SkipInResponse?: boolean
  Condition?: string
  LogToConsole?: boolean
  ContinueOnError?: boolean
}

export interface EntityAction {
  ActionName: string
  Label: string
  OnType: string
  InstanceOptional: boolean
  RequestSubjectRelations?: string[]
  ReferenceId: string
  InFields: ActionField[]
  OutFields: ActionOutcome[]
  Validations?: any[]
  Conformations?: any[]
}

export interface ActionResponse {
  ResponseType: string
  Attributes: any
}

export interface UseEntityActionsProps {
  entityName: string
  entityId?: string
}

export const useEntityActions = ({ entityName, entityId }: UseEntityActionsProps) => {
  const { toast } = useToast()
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [actionResponses, setActionResponses] = useState<Record<string, ActionResponse[]>>({})

  // Fetch actions for the entity
  const {
    data: actions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`entity-${entityName}-actions`],
    queryFn: async () => {
      try {
        const { actions } = await EntityApiService.fetchSchema(entityName)
        return actions as EntityAction[]
      } catch (err) {
        console.error(`Error fetching actions for ${entityName}:`, err)
        throw err
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!entityName,
  })

  const getActionSchema = useCallback(
    async (actionId: string) => {
      try {
        const actionSchemaBase64 = await EntityApiService.executeAction('action',
          'get_action_schema',
          {
            action_id: actionId,
          }
        );
        const actionSchema = JSON.parse(atob(actionSchemaBase64[0].Attributes.content));
        console.log("actionSchema", actionSchema);
        return actionSchema;
      } catch (error) {
        console.error(`Error executing action ${actionId}:`, error)
        toast({
          variant: 'destructive',
          title: `Failed to execute ${actionId}`,
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
        throw error
      }
    },
    [toast]
  );


  // Filter actions based on whether they require an instance or not
  const getAvailableActions = useCallback(() => {
    if (!actions) return []

    // If entityId is provided, return all actions
    if (entityId) {
      return actions
    }

    // If no entityId, only return actions that don't require an instance
    return actions.filter(action => action.InstanceOptional)
  }, [actions, entityId])

  // Execute an action
  const executeAction = useCallback(async (
    entityName: string,
    actionName: string,
    payload: Record<string, any>
  ) => {
    if (!entityName) {
      throw new Error('Entity name is required')
    }

    setActionInProgress(actionName)

    try {
      // Add entityId to payload if available
      const actionPayload = entityId
        ? { ...payload, [entityName + "_id"]: entityId }
        : payload

      const response = await EntityApiService.executeAction(
        entityName,
        actionName,
        actionPayload
      )

      // Store response for the action
      setActionResponses(prev => ({
        ...prev,
        [actionName]: response
      }))

      // Process the response based on response types
      if (Array.isArray(response)) {
        // Handle different response types
        response.forEach((item) => {
          switch (item.ResponseType) {
            case 'client.file.download': {
              const { content, contentType, name } = item.Attributes;
              // Convert base64 to blob and trigger download
              const binaryString = window.atob(content);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: contentType });
              const url = URL.createObjectURL(blob);

              // Create a temporary link and trigger download
              const a = document.createElement('a');
              a.href = url;
              a.download = name;
              document.body.appendChild(a);
              a.click();

              // Clean up
              setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }, 100);
              break;
            }

            case 'client.store.set': {
              const { key, value } = item.Attributes;
              // Store in localStorage
              localStorage.setItem(key, value);
              break;
            }

            case 'client.cookie.set': {
              const { key, value } = item.Attributes;
              // Set cookie
              document.cookie = value;
              break;
            }

            case 'client.notify': {
              const { message, title, type } = item.Attributes;
              // Show notification
              toast({
                title,
                description: message,
                variant: type === 'error' ? 'destructive' : undefined,
              });
              break;
            }

            case 'client.redirect': {
              const { delay, location, window: target } = item.Attributes;
              // Handle redirection
              setTimeout(() => {
                if (target === 'new') {
                  window.open(location, '_blank');
                } else {
                  window.location.href = location;
                }
              }, delay);
              break;
            }

            default:
              // For unhandled response types, just log them
              console.log('Unhandled response type:', item.ResponseType, item);
          }
        });
      }

      // Only show a generic success toast if no client.notify response was included
      if (!Array.isArray(response) || !response.some(r => r.ResponseType === 'client.notify')) {
        toast({
          title: 'Action Completed',
          description: `${actionName} was executed successfully`,
        })
      }

      return response
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: err.message || `Failed to execute ${actionName}`,
      })
      throw err
    } finally {
      setActionInProgress(null)
    }
  }, [entityName, entityId, toast])

  // Reset state when entityName or entityId changes
  useEffect(() => {
    setActionResponses({})
    setActionInProgress(null)
  }, [entityName, entityId])

  return {
    actions: getAvailableActions(),
    isLoading,
    getActionSchema,
    error,
    executeAction,
    actionInProgress,
    actionResponses,
    refetchActions: refetch,
  }
}
