import React, { createContext, useCallback, useEffect, useState, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { daptinClient } from '@/daptin'
import { useToast } from '@/hooks/use-toast'
import { ColumnDefinition } from '@/features/entity/columns'
import { safelySerializeData } from '@/features/entity/utils/serializer.ts'

// Define the single entity context type
interface SingleEntityContextType {
  entityName: string
  entityId: string
  selectedItem: any | null
  setSelectedItem: any | null
  schema: any
  isLoading: boolean
  columns: ColumnDefinition[]
  error: Error | null
  fetchData: () => void
  updateItem: (item: any) => Promise<any>
  createItem: (item: any) => Promise<any>
  deleteItem: () => Promise<any>
  executeAction: (actionName: string, payload: any) => Promise<any>
  availableActions: any[]
  relations: any[]
  relatedEntities: Record<string, any[]>
  isLoadingRelations: boolean
  refresh: () => void
}

// Create the single entity context
export const SingleEntityContext = createContext<
  SingleEntityContextType | undefined
>(undefined)

// Create a provider component for the single entity context
export const SingleEntityProvider: React.FC<{
  children: React.ReactNode
  entityName: string
  entityId: string
}> = ({ children, entityName, entityId }) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [schema, setSchema] = useState<any>(null)
  const [availableActions, setAvailableActions] = useState<any[]>([])
  const [relations, setRelations] = useState<any[]>([])
  const [relatedEntities, setRelatedEntities] = useState<Record<string, any[]>>(
    {}
  )
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [schemaLoaded, setSchemaLoaded] = useState(false)
  const [columns, setColumns] = useState<ColumnDefinition[]>([])

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Log only when entityName or entityId changes
  useEffect(() => {
    console.log("SingleEntityProvider.load", entityName, entityId)
  }, [entityName, entityId]);

  // Reset state when entityName or entityId changes
  useEffect(() => {
    setSelectedItem(null)
    setSchema(null)
    setAvailableActions([])
    setRelations([])
    setRelatedEntities({})
    setSchemaLoaded(false)
  }, [entityName, entityId]);

  // Memoize fetchSchema to prevent unnecessary recreations
  const fetchSchema = useCallback(async () => {
    if (!entityName) return

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

        try {
          // Check if world_schema_json is available
          if (schemaData.world_schema_json) {
            try {
              // Parse the schema JSON from the backend
              const parsedSchema = JSON.parse(schemaData.world_schema_json)
              const normalizedColumns = parsedSchema.Columns

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
                    query: JSON.stringify([
                      {
                        column: 'entity_name',
                        operator: 'eq',
                        value: entityName,
                      },
                    ]),
                  }
                )

                if (actionsResponse.data && actionsResponse.data.length > 0) {
                  setAvailableActions(actionsResponse.data)
                }
              } catch (actionError) {
                console.warn('Error fetching actions:', actionError)
              }
            } catch (jsonParseError) {
              console.error(
                'Error parsing world_schema_json:',
                jsonParseError
              )
            }
          }
        } catch (error) {
          console.error('Error processing schema information:', error)
        }
      }

      setSchemaLoaded(true)
    } catch (err) {
      console.error(`Error fetching schema for ${entityName}:`, err)
      setSchemaLoaded(true) // Still mark as loaded so we can try to fetch the entity
    }
  }, [entityName]);

  // Fetch schema and entity information
  useEffect(() => {
    fetchSchema()
  }, [fetchSchema])

  // Fetch entity data
  const {
    data: queryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [`entity-${entityName}-${entityId}`],
    queryFn: async () => {
      try {
        const response = await daptinClient.jsonApi.find(entityName, entityId, {
          included_relations: '*',
        })

        if (response.errors && response.errors.length) {
          throw new Error(
            response.errors[0].detail || `Failed to fetch ${entityName} data`
          )
        }

        return safelySerializeData(response.data)
      } catch (err) {
        console.error(
          `Error fetching ${entityName} data for ID ${entityId}:`,
          err
        )
        throw err
      }
    },
    staleTime: 30000, // Add staleTime to prevent frequent refetches
    refetchOnMount: false, // Only refetch when explicitly needed
    refetchOnWindowFocus: false,
    enabled: !!entityName && !!entityId && schemaLoaded,
  })

  // Update data state when query data changes
  useEffect(() => {
    if (queryData) {
      setSelectedItem(queryData)
    }
  }, [queryData])

  // Fetch related entities when the main entity data is loaded
  useEffect(() => {
    const fetchRelatedEntities = async () => {
      if (!selectedItem || !relations.length) return

      setIsLoadingRelations(true)
      const relatedData: Record<string, any[]> = {}

      try {
        for (const relation of relations) {
          let relationEntityName: string
          let queryParam: Record<string, string>

          if (relation.Subject === entityName) {
            // This entity is the subject, we need to find objects
            relationEntityName = relation.Object
            queryParam = {
              query: JSON.stringify([
                {
                  column: `${entityName}_id`,
                  operator: 'eq',
                  value: entityId,
                },
              ]),
            }
          } else {
            // This entity is the object, we need to find subjects
            relationEntityName = relation.Subject
            queryParam = {
              query: JSON.stringify([
                {
                  column: `${entityName}_id`,
                  operator: 'eq',
                  value: entityId,
                },
              ]),
            }
          }

          try {
            const relationResponse = await daptinClient.jsonApi.findAll(
              relationEntityName,
              queryParam
            )

            if (!relationResponse.errors) {
              relatedData[relationEntityName] = safelySerializeData(
                relationResponse.data
              )
            }
          } catch (relationError) {
            console.warn(
              `Error fetching related entity ${relationEntityName}:`,
              relationError
            )
          }
        }

        setRelatedEntities(relatedData)
      } catch (err) {
        console.error('Error fetching related entities:', err)
      } finally {
        setIsLoadingRelations(false)
      }
    }

    fetchRelatedEntities()
  }, [selectedItem, relations, entityName, entityId])

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
    mutationFn: async (item: any) => {
      const processedItem = { ...item }

      const response = await daptinClient.jsonApi.update(entityName, {
        id: entityId,
        ...processedItem,
      })

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to update item')
      }

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`entity-${entityName}-${entityId}`],
      })
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
    mutationFn: async () => {
      const response = await daptinClient.jsonApi.destroy(entityName, entityId)

      if (response.errors && response.errors.length) {
        throw new Error(response.errors[0].detail || 'Failed to delete item')
      }

      return entityId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`entity-${entityName}`] })
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
  const updateItem = async (item: any) => {
    return updateMutation.mutateAsync(item)
  }

  // Exposed functions
  const createItem = async (item: any) => {
    return createMutation.mutateAsync(item)
  }

  const deleteItem = async () => {
    return deleteMutation.mutateAsync()
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

      // Prepare the payload with the entity ID if it's an instance action
      const actionPayload = {
        ...payload,
      }

      if (!action.instance_optional) {
        actionPayload.id = entityId
      }

      // Execute the action
      const response = await daptinClient.actionManager.doAction(
        entityName,
        actionName,
        actionPayload
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

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    entityName,
    entityId,
    selectedItem,
    setSelectedItem,
    schema,
    isLoading,
    columns,
    error,
    fetchData: refetch,
    updateItem,
    createItem,
    deleteItem,
    executeAction,
    availableActions,
    relations,
    relatedEntities,
    isLoadingRelations,
    refresh,
  }), [
    entityName,
    entityId,
    selectedItem,
    schema,
    isLoading,
    columns,
    error,
    refetch,
    updateItem,
    createItem,
    deleteItem,
    executeAction,
    availableActions,
    relations,
    relatedEntities,
    isLoadingRelations,
    refresh,
  ]);

  return (
    <SingleEntityContext.Provider value={contextValue}>
      {children}
    </SingleEntityContext.Provider>
  )
}
