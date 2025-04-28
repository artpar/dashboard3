import React, { createContext, useCallback, useEffect, useState, useMemo } from 'react'
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
  showPasteDialog: boolean
  setShowPasteDialog: (show: boolean) => void
  clipboardData: any[] | null
  setClipboardData: (data: any[] | null) => void
  copySelectedItems: () => void
  pasteItems: () => Promise<void>
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
  // Use a Map for faster lookups of selected items
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, any>>(new Map())
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
  const [showPasteDialog, setShowPasteDialog] = useState(false)
  const [clipboardData, setClipboardData] = useState<any[] | null>(null)

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

  // Keep selectedItems array and selectedItemsMap in sync
  useEffect(() => {
    const newMap = new Map();
    selectedItems.forEach(item => {
      const itemId = item.id || item.reference_id;
      newMap.set(itemId, item);
    });
    setSelectedItemsMap(newMap);
  }, [selectedItems]);

  // Item selection helpers - optimized for performance
  const toggleItemSelection = useCallback((item: any) => {
    const itemId = item.id || item.reference_id;

    setSelectedItemsMap(prevMap => {
      const newMap = new Map(prevMap);
      if (newMap.has(itemId)) {
        newMap.delete(itemId);
      } else {
        newMap.set(itemId, item);
      }

      // Update the selectedItems array based on the map
      const newSelectedItems = Array.from(newMap.values());
      setSelectedItems(newSelectedItems);

      return newMap;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    if (selectedItems.length === data.length) {
      // If all items are already selected, clear the selection
      setSelectedItems([]);
      setSelectedItemsMap(new Map());
    } else {
      // Otherwise, select all items - create a new map for faster lookups
      const newMap = new Map();
      data.forEach(item => {
        const itemId = item.id || item.reference_id;
        newMap.set(itemId, item);
      });
      setSelectedItemsMap(newMap);
      setSelectedItems(data.slice()); // Use slice to create a new array
    }
  }, [data, selectedItems.length]);

  const clearSelectedItems = useCallback(() => {
    setSelectedItems([]);
    setSelectedItemsMap(new Map());
  }, []);

  // Memoized isItemSelected function for better performance
  const isItemSelected = useCallback((item: any) => {
    const itemId = item.id || item.reference_id;
    return selectedItemsMap.has(itemId);
  }, [selectedItemsMap])

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

  // Copy selected items to clipboard in the required format
  const copySelectedItems = useCallback(() => {
    if (selectedItems.length === 0) {
      toast({
        variant: 'default',
        title: 'No items selected',
        description: 'Please select at least one item to copy.',
      })
      return
    }

    // Format the selected items as an array of objects with columnName: value pairs
    const formattedItems = selectedItems.map(item => {
      const formattedItem: Record<string, any> = {}
      // Add all properties from the item
      Object.keys(item).forEach(key => {
        // Skip internal properties that start with underscore
        if (!key.startsWith('_')) {
          formattedItem[key] = item[key]
        }
      })
      return formattedItem
    })

    // Set the clipboard data in the state
    setClipboardData(formattedItems)

    // Copy to system clipboard as JSON string
    try {
      const jsonString = JSON.stringify(formattedItems, null, 2)
      navigator.clipboard.writeText(jsonString).then(() => {
        toast({
          title: 'Copied to clipboard',
          description: `${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} copied`,
        })
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err)
        toast({
          variant: 'destructive',
          title: 'Copy failed',
          description: 'Could not copy to system clipboard. Data is still available for internal paste.',
        })
      })
    } catch (err) {
      console.error('Error stringifying data:', err)
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not format data for clipboard.',
      })
    }
  }, [selectedItems, toast])

  // Paste items from clipboard
  const pasteItems = useCallback(async () => {
    console.log("CEDP.pasteItems", clipboardData)
    if (!clipboardData || clipboardData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No data to paste',
        description: 'Clipboard is empty. Copy some items first.',
      })
      return
    }

    // Check if the clipboard data has the correct type
    const hasCorrectType = clipboardData.every(item => {
      return item.__type === entityName || !item.__type
    })

    if (!hasCorrectType) {
      toast({
        variant: 'destructive',
        title: 'Type mismatch',
        description: `Cannot paste items of different type into ${entityName}.`,
      })
      return
    }

    // Create each item from the clipboard
    const results = []
    for (const item of clipboardData) {
      try {
        // Prepare item for creation by removing any IDs or reference IDs
        // to ensure we create new items rather than trying to update existing ones
        const newItem = { ...item }
        delete newItem.id
        delete newItem.reference_id

        // Set the correct type if not already set
        if (!newItem.__type) {
          newItem.__type = entityName
        }

        // Create the item
        const result = await createItem(newItem)
        results.push({ success: true, result })
      } catch (error) {
        results.push({ success: false, error })
      }
    }

    // Show toast with results
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    if (failureCount === 0) {
      toast({
        title: 'Success',
        description: `${successCount} item${successCount !== 1 ? 's' : ''} pasted successfully`,
      })
    } else if (successCount === 0) {
      toast({
        variant: 'destructive',
        title: 'Paste failed',
        description: 'All paste operations failed',
      })
    } else {
      toast({
        variant: 'default',
        title: 'Partial Success',
        description: `${successCount} pasted, ${failureCount} failed`,
      })
    }

    // Refresh data
    fetchData()
    setShowPasteDialog(false)
  }, [clipboardData, entityName, createItem, fetchData, toast])

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
    showPasteDialog,
    setShowPasteDialog,
    clipboardData,
    setClipboardData,
    copySelectedItems,
    pasteItems,
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
