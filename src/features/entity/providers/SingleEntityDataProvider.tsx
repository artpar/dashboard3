import React, { createContext, useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { TableRelation } from '@/features/entity/SingleEntityAllRelationsViewComponent.tsx'
import { EntityApiService } from '../services/EntityApiService'
import {
  BaseEntityContextType,
  BaseEntityDataProvider,
} from './BaseEntityDataProvider'

// Define the single entity context type
export interface SingleEntityContextType extends BaseEntityContextType {
  entityId: string
  selectedItem: any | null
  setSelectedItem: React.Dispatch<React.SetStateAction<any | null>>
  fetchData: () => void
  updateItem: (item: any) => Promise<any>
  createItem: (item: any) => Promise<any>
  deleteItem: () => Promise<any>
  relatedEntities: Record<string, any[]>
  isLoadingRelations: boolean
}

// Create the single entity context
export const SingleEntityContext = createContext<
  SingleEntityContextType | undefined
>(undefined)

// Create a provider component for the single entity context
export const SingleEntityDataProvider: React.FC<{
  children: React.ReactNode
  entityName: string
  entityId: string
  entity: any
  relations?: TableRelation[]
}> = ({ children, entityName, entity, entityId, relations = [] }) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(entity)
  const [relatedEntities, setRelatedEntities] = useState<Record<string, any[]>>(
    {}
  )

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Reset state when entityName or entityId changes
  useEffect(() => {
    setSelectedItem(null)
    setRelatedEntities({})
  }, [entityName, entityId])

  // Fetch entity data
  const {
    data: queryData,
    isLoading: isLoadingData,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [`entity-${entityName}-${entityId}`],
    queryFn: async () => {
      if (entityId === 'new') {
        return {}
      }
      return EntityApiService.fetchSingleEntity(entityName, entityId)
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!entityName && !!entityId,
  })

  // Update data state when query data changes
  useEffect(() => {
    if (queryData) {
      setSelectedItem(queryData)
    }
  }, [queryData])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newItem: any) => {
      return EntityApiService.createEntity(entityName, newItem)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`entity-${entityName}`] })
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
      return EntityApiService.updateEntity(entityName, entityId, item)
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
      return EntityApiService.deleteEntity(entityName, entityId)
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

  // Fetch related entities when the main entity data and relations are loaded
  const { data: relationsData, isLoading: isLoadingRelationsData } = useQuery({
    queryKey: [
      `entity-${entityName}-${entityId}-relations`,
      entityName,
      entityId,
      relations,
    ],
    queryFn: async ({ queryKey }) => {
      const [_, entityName, entityId, relations] = queryKey
      if (entityId === 'new') {
        return {};
      }

      return EntityApiService.fetchRelatedEntities(
        entityName as string,
        entityId as string,
        relations as TableRelation[]
      )
    },
    enabled:
      !!selectedItem && !!entityName && !!entityId && relations.length > 0,
  })

  // Update related entities when data changes
  useEffect(() => {
    if (relationsData) {
      setRelatedEntities(relationsData)
    }
  }, [relationsData])

  // Exposed functions
  const createItem = async (item: any) => {
    return createMutation.mutateAsync(item)
  }

  const updateItem = async (item: any) => {
    return updateMutation.mutateAsync(item)
  }

  const deleteItem = async () => {
    return deleteMutation.mutateAsync()
  }

  const fetchData = useCallback(() => {
    refetch()
  }, [refetch])

  // Single entity specific context
  const singleEntityContextValue: Partial<SingleEntityContextType> = {
    entityId,
    selectedItem,
    setSelectedItem,
    fetchData,
    updateItem,
    createItem,
    deleteItem,
    relatedEntities,
    isLoadingRelations: isLoadingRelationsData,
    isLoading: isLoadingData,
    error:
      queryError instanceof Error
        ? queryError
        : queryError
          ? new Error(String(queryError))
          : null,
  }

  return (
    <BaseEntityDataProvider
      entityName={entityName}
      context={SingleEntityContext}
      contextValue={singleEntityContextValue}
    >
      {children}
    </BaseEntityDataProvider>
  )
}
