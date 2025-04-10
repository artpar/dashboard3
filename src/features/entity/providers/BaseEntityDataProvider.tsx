import React, { createContext, useCallback, useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { ColumnDefinition } from '@/features/entity/columns'
import { EntityApiService } from '../services/EntityApiService'

// Define the base entity context type
export interface BaseEntityContextType {
  entityName: string
  schema: any
  columns: ColumnDefinition[]
  availableActions: any[]
  relations: any[]
  isLoading: boolean
  error: Error | null
  refresh: () => void
  executeAction: (actionName: string, payload: any) => Promise<any>
}

// Create a base provider component for entity data
export const BaseEntityDataProvider: React.FC<{
  children: React.ReactNode
  entityName: string
  context: React.Context<any>
  contextValue: any
}> = ({ children, entityName, context, contextValue }) => {
  const [schema, setSchema] = useState<any>(null)
  const [columns, setColumns] = useState<ColumnDefinition[]>([])
  const [availableActions, setAvailableActions] = useState<any[]>([])
  const [relations, setRelations] = useState<any[]>([])
  const [schemaLoading, setSchemaLoading] = useState(true)
  const [schemaError, setSchemaError] = useState<Error | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Reset state when entityName changes
  useEffect(() => {
    setSchema(null)
    setColumns([])
    setAvailableActions([])
    setRelations([])
    setSchemaLoading(true)
    setSchemaError(null)
  }, [entityName])

  // Fetch schema information
  useEffect(() => {
    const fetchSchemaData = async () => {
      if (!entityName) return

      try {
        setSchemaLoading(true)
        const { schema, columns, relations, actions } = await EntityApiService.fetchSchema(entityName)
        
        setSchema(schema)
        setColumns(columns)
        setRelations(relations)
        setAvailableActions(actions)
        setSchemaError(null)
      } catch (err) {
        console.error(`Error fetching schema for ${entityName}:`, err)
        setSchemaError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setSchemaLoading(false)
      }
    }

    fetchSchemaData()
  }, [entityName])

  // Execute custom action on an entity
  const executeAction = useCallback(
    async (actionName: string, payload: any) => {
      try {
        // Check if the action exists
        const action = availableActions.find((a) => a.action_name === actionName)
        if (!action) {
          throw new Error(
            `Action '${actionName}' not found for entity '${entityName}'`
          )
        }

        // Execute the action
        const response = await EntityApiService.executeAction(
          entityName,
          actionName,
          payload
        )

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: [`entity-${entityName}`] })

        toast({
          title: 'Success',
          description: `Action ${actionName} executed successfully`,
        })

        return response
      } catch (error) {
        console.error(`Error executing action ${actionName}:`, error)
        toast({
          variant: 'destructive',
          title: `Failed to execute ${actionName}`,
          description:
            error instanceof Error ? error.message : 'An error occurred',
        })
        throw error
      }
    },
    [availableActions, entityName, queryClient, toast]
  )

  // Refresh data
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [`entity-${entityName}`] })
  }, [entityName, queryClient])

  // Create the base context value
  const baseContextValue: BaseEntityContextType = {
    entityName,
    schema,
    columns,
    availableActions,
    relations,
    isLoading: schemaLoading,
    error: schemaError,
    refresh,
    executeAction,
  }

  // Merge the base context with the specific context
  const mergedContextValue = {
    ...baseContextValue,
    ...contextValue,
  }

  const ContextProvider = context.Provider

  return <ContextProvider value={mergedContextValue}>{children}</ContextProvider>
}