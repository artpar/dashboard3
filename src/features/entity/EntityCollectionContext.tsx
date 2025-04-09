import React, { createContext, useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useToast } from '@/hooks/use-toast'
import { safelySerializeData } from '@/features/entity/utils/serializer.ts'
import { ColumnDefinition } from '@/features/entity/columns'

// Define the entity data context type
interface EntityCollectionContextType {
  entityName: string
  data: any[]
  schema: any
  isLoading: boolean
  error: Error | null
  fetchData: () => void
  createItem: (item: any) => Promise<any>
  updateItem: (id: string, item: any) => Promise<any>
  deleteItem: (id: string) => Promise<any>
  executeAction: (actionName: string, payload: any) => Promise<any>
  selectedItem: any
  setSelectedItem: (item: any) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
  filters: Record<string, any>
  setFilters: (filters: Record<string, any>) => void
  showCreateDialog: boolean
  setShowCreateDialog: (show: boolean) => void
  showEditDialog: boolean
  setShowEditDialog: (show: boolean) => void
  showDeleteDialog: boolean
  setShowDeleteDialog: (show: boolean) => void
  showFilterDialog: boolean
  setShowFilterDialog: (show: boolean) => void
  columns: ColumnDefinition[]
  availableActions: any[]
  relations: any[]
  refresh: () => void
}

// Create the entity context
export const EntityCollectionContext = createContext<
  EntityCollectionContextType | undefined
>(undefined)

// Create a provider component for the entity context
export const EntityCollectionDataProvider: React.FC<{
  children: React.ReactNode
  entityName: string
}> = ({ children, entityName }) => {
  const [data, setData] = useState<any[]>([])
  const [schema, setSchema] = useState<any>(null)
  const [columns, setColumns] = useState<ColumnDefinition[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [availableActions, setAvailableActions] = useState<any[]>([])
  const [relations, setRelations] = useState<any[]>([])
  const [columnsLoading, setColumnsLoading] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Reset state when entityName changes
  useEffect(() => {
    console.log('EntityContext.resetState', entityName)
    setSchema(null)
    setColumns([])
    setData([])
    setSelectedItem(null)
    setCurrentPage(1)
    setTotalPages(1)
    setFilters({})
    setAvailableActions([])
    setRelations([])
  }, [entityName])

  // Separate effect to fetch schema and columns when entityName changes
  useEffect(() => {
    // console.log('EntityCollectionDataProvider.useEffect', entityName)
    const fetchSchema = async () => {
      // console.log('EntityCollectionDataProvider.fetchSchema', entityName)
      if (!entityName) return

      setColumnsLoading(true)
      try {
        // Fetch schema information from world entity
        const worldResponse = await daptinClient.jsonApi.findAll('world', {
          query: JSON.stringify([
            {
              column: 'table_name',
              operator: 'eq',
              value: entityName,
            },
          ]),
        })

        if (worldResponse.errors && worldResponse.errors.length) {
          throw new Error(
            worldResponse.errors[0].detail ||
              `Failed to get schema for ${entityName}`
          )
        }

        if (worldResponse.data && worldResponse.data.length > 0) {
          const schemaData = worldResponse.data[0]
          setSchema(schemaData)

          // Parse column information from schema
          try {
            // Check if world_schema_json is available
            let normalizedColumns: ColumnDefinition[] = []
            if (schemaData.world_schema_json) {
              try {
                // Parse the schema JSON from the backend
                const parsedSchema = JSON.parse(schemaData.world_schema_json)

                // Extract columns from the parsed schema
                if (parsedSchema && parsedSchema.Columns) {
                  normalizedColumns = parsedSchema.Columns

                  // console.log('Setting columns:', normalizedColumns.length)
                  setColumns(normalizedColumns)

                  // Set relations from the parsed schema
                  if (parsedSchema.Relations) {
                    const entityRelations = parsedSchema.Relations.filter(
                      (relation: any) =>
                        relation.Subject === entityName ||
                        relation.Object === entityName
                    )
                    setRelations(entityRelations)
                  }

                  // Fetch actions for this entity
                  try {
                    const actionsResponse = await daptinClient.jsonApi.findAll(
                      'action',
                      {
                        world_id: schemaData.reference_id,
                      }
                    )

                    if (
                      actionsResponse.data &&
                      actionsResponse.data.length > 0
                    ) {
                      setAvailableActions(actionsResponse.data)
                    }
                  } catch (actionError) {
                    console.warn('Error fetching actions:', actionError)
                  }
                }
              } catch (jsonParseError) {
                console.error(
                  'Error parsing world_schema_json:',
                  jsonParseError
                )
                // Fall back to existing approach
              }
            }
          } catch (error) {
            console.error('Error processing schema information:', error)
          }
        }
      } catch (err) {
        console.error(`Error fetching schema for ${entityName}:`, err)
      } finally {
        setColumnsLoading(false)
      }
    }

    fetchSchema()
  }, [entityName])

  // Parse filter query format for daptin
  const parseFilters = useCallback(() => {
    if (Object.keys(filters).length === 0) return undefined

    const filterQuery = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([column, value]) => {
        return {
          column,
          operator: typeof value === 'string' ? 'ilike' : 'eq',
          value: typeof value === 'string' ? `%${value}%` : value,
        }
      })

    return filterQuery.length > 0 ? JSON.stringify(filterQuery) : undefined
  }, [filters])

  // Fetch entity data
  const {
    data: queryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    // Use a more specific queryKey with a prefix to avoid conflicts
    queryKey: [`entity-${entityName}`, currentPage, pageSize, filters],
    queryFn: async () => {
      try {
        // Main data query
        const response = await daptinClient.jsonApi.findAll(entityName, {
          'page[size]': pageSize.toString(),
          'page[number]': currentPage.toString(),
          included_relations: '*',
          sort: '-created_at',
          query: parseFilters(),
        })

        if (response.errors && response.errors.length) {
          throw new Error(
            response.errors[0].detail || `Failed to fetch ${entityName} data`
          )
        }

        // Calculate total pages
        const totalItems = response.meta?.total || response.data.length
        setTotalPages(Math.ceil(totalItems / pageSize))

        return safelySerializeData(response.data)
      } catch (err) {
        console.error(`Error fetching ${entityName} data:`, err)
        throw err
      }
    }, // Add these options to ensure fresh data when navigating
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!entityName && !columnsLoading,
  })

  // Update data state when query data changes
  useEffect(() => {
    if (queryData) {
      setData(queryData)
    }
  }, [queryData])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newItem: any) => {
      const response = await daptinClient.jsonApi.create(entityName, newItem)
      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to create item')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] })
      toast({
        title: 'Success',
        description: 'Item created successfully',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create item',
        description: error.message || 'An error occurred',
      })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: any }) => {
      // Process relationship objects to ensure they have both type and id
      const processedItem = { ...item }

      const response = await daptinClient.jsonApi.update(entityName, {
        id,
        ...processedItem,
      })
      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to update item')
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] })
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update item',
        description: error.message || 'An error occurred',
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await daptinClient.jsonApi.destroy(entityName, id)
      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to delete item')
      }
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] })
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      })
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete item',
        description: error.message || 'An error occurred',
      })
    },
  })

  // Exposed functions
  const createItem = async (item: any) => {
    return createMutation.mutateAsync(item)
  }

  const updateItem = async (id: string, item: any) => {
    return updateMutation.mutateAsync({ id, item })
  }

  const deleteItem = async (id: string) => {
    return deleteMutation.mutateAsync(id)
  }

  const fetchData = useCallback(() => {
    refetch()
  }, [refetch])

  const refresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Execute custom action on an entity
  const executeAction = async (actionName: string, payload: any) => {
    try {
      // Check if the action exists
      const action = availableActions.find((a) => a.action_name === actionName)
      if (!action) {
        throw new Error(
          `Action '${actionName}' not found for entity '${entityName}'`
        )
      }

      // Execute the action
      const response = await daptinClient.actionManager.doAction(
        entityName,
        actionName,
        payload
      )

      // Force refresh data after action
      await refetch()

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
  }

  const contextValue: EntityCollectionContextType = {
    entityName,
    data,
    schema,
    isLoading,
    error:
      error instanceof Error ? error : error ? new Error(String(error)) : null,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    executeAction,
    selectedItem,
    setSelectedItem,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filters,
    setFilters,
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showFilterDialog,
    setShowFilterDialog,
    columns,
    availableActions,
    relations,
    refresh,
  }

  return (
    <EntityCollectionContext.Provider value={contextValue}>
      {children}
    </EntityCollectionContext.Provider>
  )
}
