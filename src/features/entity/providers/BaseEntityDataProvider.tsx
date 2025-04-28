import React, { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { ColumnDefinition } from '@/features/entity/columns'
import { SYSTEM_COLUMNS } from '@/features/entity/types.ts'
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
  visibleColumns: string[]
  toggleColumnVisibility: (columnKey: string) => void
  resetColumnVisibility: () => void
  showAllColumns: () => void
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

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([])

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
    setVisibleColumns([])
  }, [entityName])

  // Fetch schema information
  useEffect(() => {
    const fetchSchemaData = async () => {
      if (!entityName) return

      try {
        setSchemaLoading(true)
        const { schema, columns, relations, actions } =
          await EntityApiService.fetchSchema(entityName)

        setSchema(schema)
        setColumns(columns)
        setRelations(relations)
        setAvailableActions(actions)
        setSchemaError(null)

        // Initialize visible columns (excluding audit columns)
        const AUDIT_COLUMNS = SYSTEM_COLUMNS
        setVisibleColumns(
          columns
            .filter((col) => !AUDIT_COLUMNS.includes(col.ColumnName))
            .map((col) => col.ColumnName)
        )
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
        const action = availableActions.find(
          (a) => a.action_name === actionName
        )
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

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    )
  }, [])

  // Reset column visibility to default
  const resetColumnVisibility = useCallback(() => {
    const AUDIT_COLUMNS = ['created_at', 'updated_at', 'reference_id']
    setVisibleColumns(
      columns
        .filter((col) => !AUDIT_COLUMNS.includes(col.ColumnName))
        .map((col) => col.ColumnName)
    )
  }, [columns])

  // Show all columns
  const showAllColumns = useCallback(() => {
    setVisibleColumns(columns.map((col) => col.ColumnName))
  }, [columns])

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
    visibleColumns,
    toggleColumnVisibility,
    resetColumnVisibility,
    showAllColumns,
  }

  // Merge the base context with the specific context
  const mergedContextValue = {
    ...baseContextValue,
    ...contextValue,
  }

  const ContextProvider = context.Provider

  return (
    <ContextProvider value={mergedContextValue}>{children}</ContextProvider>
  )
}
