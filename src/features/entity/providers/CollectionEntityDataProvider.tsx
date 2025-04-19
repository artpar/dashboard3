import React, { createContext, useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { BaseEntityContextType, BaseEntityDataProvider } from './BaseEntityDataProvider'
import { EntityApiService } from '../services/EntityApiService'

// Define the collection entity context type
export interface CollectionEntityContextType extends BaseEntityContextType {
  data: any[]
  selectedItem: any
  setSelectedItem: (item: any) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  totalPages: number
  pagination: {
    currentPage: number
    from: number
    lastPage: number
    perPage: number
    to: number
    total: number
  } | null
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
  fetchData: () => void
  createItem: (item: any) => Promise<any>
  updateItem: (id: string, item: any) => Promise<any>
  deleteItem: (id: string) => Promise<any>
}

// Create the collection entity context
export const CollectionEntityContext = createContext<
  CollectionEntityContextType | undefined
>(undefined)

// Create a provider component for the collection entity context
export const CollectionEntityDataProvider: React.FC<{
  children: React.ReactNode
  entityName: string
}> = ({ children, entityName }) => {
  const [data, setData] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [pagination, setPagination] = useState<{
    currentPage: number
    from: number
    lastPage: number
    perPage: number
    to: number
    total: number
  } | null>(null)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Reset state when entityName changes
  useEffect(() => {
    setData([])
    setSelectedItem(null)
    setCurrentPage(1)
    setTotalPages(1)
    setPagination(null)
    setFilters({})
  }, [entityName])

  // Fetch entity collection data
  const {
    data: queryData,
    isLoading: isLoadingData,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [`entity-${entityName}-collection`, currentPage, pageSize, filters],
    queryFn: async () => {
      return EntityApiService.fetchEntityCollection(entityName, {
        page: currentPage,
        pageSize,
        filters,
      })
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled: !!entityName,
  })

  // Update data state when query data changes
  useEffect(() => {
    if (queryData) {
      setData(queryData.data)
      setTotalPages(queryData.totalPages)
      setPagination(queryData.pagination)
      // Ensure currentPage is in sync with pagination data
      if (queryData.pagination && queryData.pagination.currentPage !== currentPage) {
        setCurrentPage(queryData.pagination.currentPage)
      }
    }
  }, [queryData, currentPage])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newItem: any) => {
      return EntityApiService.createEntity(entityName, newItem)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`entity-${entityName}-collection`] })
      toast({
        title: 'Success',
        description: 'Item created successfully',
      })
      setShowCreateDialog(false)
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
      return EntityApiService.updateEntity(entityName, id, item)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`entity-${entityName}-collection`] })
      toast({
        title: 'Success',
        description: 'Item updated successfully',
      })
      setShowEditDialog(false)
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
      return EntityApiService.deleteEntity(entityName, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`entity-${entityName}-collection`] })
      toast({
        title: 'Success',
        description: 'Item deleted successfully',
      })
      setShowDeleteDialog(false)
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
    console.log("CEDP.fetchData")
    refetch()
  }, [refetch])

  // Collection entity specific context
  const collectionContextValue: Partial<CollectionEntityContextType> = {
    data,
    selectedItem,
    setSelectedItem,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    pagination,
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
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    isLoading: isLoadingData,
    error: queryError instanceof Error ? queryError : queryError ? new Error(String(queryError)) : null,
  }

  return (
    <BaseEntityDataProvider
      entityName={entityName}
      context={CollectionEntityContext}
      contextValue={collectionContextValue}
    >
      {children}
    </BaseEntityDataProvider>
  )
}
