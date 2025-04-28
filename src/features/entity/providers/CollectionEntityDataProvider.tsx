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
  selectedItems: any[]
  setSelectedItems: (items: any[]) => void
  toggleItemSelection: (item: any) => void
  selectAllItems: () => void
  clearSelectedItems: () => void
  isItemSelected: (item: any) => boolean
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
  sortColumns: Record<string, 'asc' | 'desc'>
  setSortColumn: (column: string, direction: 'asc' | 'desc') => void
  clearSorting: () => void
  showCreateDialog: boolean
  setShowCreateDialog: (show: boolean) => void
  showEditDialog: boolean
  setShowEditDialog: (show: boolean) => void
  showDeleteDialog: boolean
  setShowDeleteDialog: (show: boolean) => void
  showBulkDeleteDialog: boolean
  setShowBulkDeleteDialog: (show: boolean) => void
  showFilterDialog: boolean
  setShowFilterDialog: (show: boolean) => void
  fetchData: () => void
  createItem: (item: any) => Promise<any>
  updateItem: (id: string, item: any) => Promise<any>
  deleteItem: (id: string) => Promise<any>
  bulkDeleteItems: (ids: string[]) => Promise<any>
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
  const [selectedItems, setSelectedItems] = useState<any[]>([])
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
  const [sortColumns, setSortColumns] = useState<Record<string, 'asc' | 'desc'>>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [showFilterDialog, setShowFilterDialog] = useState(false)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Reset state when entityName changes
  useEffect(() => {
    setData([])
    setSelectedItem(null)
    setSelectedItems([])
    setCurrentPage(1)
    setTotalPages(1)
    setPagination(null)
    setFilters({})
    setSortColumns({})
  }, [entityName])

  // Convert sortColumns object to sort string for API
  const getSortString = useCallback(() => {
    return Object.entries(sortColumns)
      .map(([column, direction]) => `${direction === 'desc' ? '-' : '+'}${column}`)
      .join(',');
  }, [sortColumns]);

  // Fetch entity collection data
  const {
    data: queryData,
    isLoading: isLoadingData,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [`entity-${entityName}-collection`, currentPage, pageSize, filters, sortColumns],
    queryFn: async () => {
      const sortString = getSortString();
      return EntityApiService.fetchEntityCollection(entityName, {
        page: currentPage,
        pageSize,
        filters,
        sort: sortString || '-created_at',
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

  // Bulk Delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Process deletions sequentially to ensure all are handled
      const results = [];
      for (const id of ids) {
        try {
          const result = await EntityApiService.deleteEntity(entityName, id);
          results.push({ id, success: true, result });
        } catch (error) {
          results.push({ id, success: false, error });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: [`entity-${entityName}-collection`] })
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      if (failureCount === 0) {
        toast({
          title: 'Success',
          description: `${successCount} item${successCount !== 1 ? 's' : ''} deleted successfully`,
        })
      } else if (successCount === 0) {
        toast({
          variant: 'destructive',
          title: 'Failed to delete items',
          description: 'All delete operations failed',
        })
      } else {
        toast({
          variant: 'default',
          title: 'Partial Success',
          description: `${successCount} deleted, ${failureCount} failed`,
        })
      }
      
      setShowBulkDeleteDialog(false)
      setSelectedItems([])
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete items',
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

  const bulkDeleteItems = async (ids: string[]) => {
    return bulkDeleteMutation.mutateAsync(ids)
  }

  // Item selection helpers
  const toggleItemSelection = useCallback((item: any) => {
    const itemId = item.id || item.reference_id;
    setSelectedItems(prev => {
      const isSelected = prev.some(i => (i.id || i.reference_id) === itemId);
      if (isSelected) {
        return prev.filter(i => (i.id || i.reference_id) !== itemId);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const selectAllItems = useCallback(() => {
    if (selectedItems.length === data.length) {
      // If all items are already selected, clear the selection
      setSelectedItems([]);
    } else {
      // Otherwise, select all items
      setSelectedItems([...data]);
    }
  }, [data, selectedItems.length]);

  const clearSelectedItems = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const isItemSelected = useCallback((item: any) => {
    const itemId = item.id || item.reference_id;
    return selectedItems.some(i => (i.id || i.reference_id) === itemId);
  }, [selectedItems])

  // Set sort column
  const setSortColumn = useCallback((column: string, direction: 'asc' | 'desc') => {
    setSortColumns(prev => {
      // Create a new object with the updated sort column
      const newSortColumns = { ...prev };
      
      // If the column is already in the sort columns, update its direction
      // If it's not, add it to the sort columns
      newSortColumns[column] = direction;
      
      return newSortColumns;
    });
  }, []);

  // Clear all sorting
  const clearSorting = useCallback(() => {
    setSortColumns({});
  }, []);

  const fetchData = useCallback(() => {
    console.log("CEDP.fetchData")
    refetch()
  }, [refetch])

  // Collection entity specific context
  const collectionContextValue: Partial<CollectionEntityContextType> = {
    data,
    selectedItem,
    setSelectedItem,
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelectedItems,
    isItemSelected,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    pagination,
    filters,
    setFilters,
    sortColumns,
    setSortColumn,
    clearSorting,
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    showFilterDialog,
    setShowFilterDialog,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
    bulkDeleteItems,
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
