import React, { createContext, useCallback, useEffect, useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useToast } from '@/components/ui/use-toast'
import { BaseEntityContextType, BaseEntityDataProvider } from './BaseEntityDataProvider'
import { EntityApiService } from '../services/EntityApiService'
import { SYSTEM_COLUMNS } from '@/features/entity/types.ts'
import { useMutationWithToast } from '../hooks/useMutationWithToast'
import { useEntitySelection } from '../hooks/useEntitySelection'
import { useDialogStates } from '../hooks/useDialogStates'

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
  const navigate = useNavigate()
  const searchParams = useSearch({ strict: false }) as {
    page?: string | number
    pageSize?: string | number
    sort?: string
    filters?: string
  }

  const [data, setData] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  // Use a Map for faster lookups of selected items
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, any>>(new Map())
  
  // Parse number parameters from URL (they come as strings)
  const parsePageNumber = (page: string | number | undefined): number => {
    if (typeof page === 'number') return page
    if (typeof page === 'string') {
      const parsed = parseInt(page, 10)
      return isNaN(parsed) ? 1 : parsed
    }
    return 1
  }
  
  const parsePageSize = (size: string | number | undefined): number => {
    if (typeof size === 'number') return size
    if (typeof size === 'string') {
      const parsed = parseInt(size, 10)
      return isNaN(parsed) ? 10 : parsed
    }
    return 10
  }
  
  // Initialize state from URL parameters
  const [currentPage, setCurrentPageInternal] = useState(parsePageNumber(searchParams?.page))
  const [pageSize, setPageSizeInternal] = useState(parsePageSize(searchParams?.pageSize))
  const [totalPages, setTotalPages] = useState(1)
  const [pagination, setPagination] = useState<{
    currentPage: number
    from: number
    lastPage: number
    perPage: number
    to: number
    total: number
  } | null>(null)
  
  // Parse filters from URL
  const parseFiltersFromUrl = useCallback(() => {
    if (searchParams?.filters) {
      try {
        return JSON.parse(searchParams.filters)
      } catch {
        return {}
      }
    }
    return {}
  }, [searchParams?.filters])
  
  // Parse sort from URL
  const parseSortFromUrl = useCallback(() => {
    if (searchParams?.sort) {
      const sortObj: Record<string, 'asc' | 'desc'> = {}
      const sortParts = searchParams.sort.split(',')
      sortParts.forEach(part => {
        if (part.startsWith('-')) {
          sortObj[part.substring(1)] = 'desc'
        } else if (part.startsWith('+')) {
          sortObj[part.substring(1)] = 'asc'
        } else {
          sortObj[part] = 'asc'
        }
      })
      return sortObj
    }
    return {}
  }, [searchParams?.sort])
  
  const [filters, setFiltersInternal] = useState<Record<string, any>>(parseFiltersFromUrl())
  const [sortColumns, setSortColumnsInternal] = useState<Record<string, 'asc' | 'desc'>>(parseSortFromUrl())
  
  const [clipboardData, setClipboardData] = useState<any[] | null>(null)

  // Use extracted hooks for dialog states
  const dialogs = useDialogStates()
  const {
    showCreateDialog, setShowCreateDialog,
    showEditDialog, setShowEditDialog,
    showDeleteDialog, setShowDeleteDialog,
    showBulkDeleteDialog, setShowBulkDeleteDialog,
    showFilterDialog, setShowFilterDialog,
    showPasteDialog, setShowPasteDialog,
  } = dialogs

  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Update URL when state changes
  const updateUrlParams = useCallback((updates: {
    page?: number
    pageSize?: number
    filters?: Record<string, any>
    sort?: string
  }) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
        filters: updates.filters ? JSON.stringify(updates.filters) : prev?.filters,
      }),
      replace: true,
    })
  }, [navigate])
  
  // Wrapper functions to update both state and URL
  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageInternal(page)
    updateUrlParams({ page })
  }, [updateUrlParams])
  
  const setPageSize = useCallback((size: number) => {
    setPageSizeInternal(size)
    setCurrentPageInternal(1) // Reset to first page when changing page size
    updateUrlParams({ pageSize: size, page: 1 })
  }, [updateUrlParams])
  
  const setFilters = useCallback((newFilters: Record<string, any>) => {
    setFiltersInternal(newFilters)
    setCurrentPageInternal(1) // Reset to first page when filtering
    updateUrlParams({ filters: newFilters, page: 1 })
  }, [updateUrlParams])
  
  const setSortColumns = useCallback((newSort: Record<string, 'asc' | 'desc'>) => {
    setSortColumnsInternal(newSort)
    const sortString = Object.entries(newSort)
      .map(([column, direction]) => `${direction === 'desc' ? '-' : '+'}${column}`)
      .join(',')
    updateUrlParams({ sort: sortString })
  }, [updateUrlParams])
  
  // Sync state with URL changes
  useEffect(() => {
    const urlPage = parsePageNumber(searchParams?.page)
    const urlPageSize = parsePageSize(searchParams?.pageSize)
    
    if (urlPage !== currentPage) {
      setCurrentPageInternal(urlPage)
    }
    if (urlPageSize !== pageSize) {
      setPageSizeInternal(urlPageSize)
    }
    const urlFilters = parseFiltersFromUrl()
    if (JSON.stringify(urlFilters) !== JSON.stringify(filters)) {
      setFiltersInternal(urlFilters)
    }
    const urlSort = parseSortFromUrl()
    if (JSON.stringify(urlSort) !== JSON.stringify(sortColumns)) {
      setSortColumnsInternal(urlSort)
    }
  }, [searchParams])

  // Reset state when entityName changes (but not on initial mount)
  const prevEntityNameRef = useRef(entityName)
  useEffect(() => {
    if (prevEntityNameRef.current !== entityName) {
      // Entity name has actually changed, reset everything
      setData([])
      setSelectedItem(null)
      setSelectedItems([])
      setCurrentPageInternal(1)
      setTotalPages(1)
      setPagination(null)
      setFiltersInternal({})
      setSortColumnsInternal({})
      // Also reset URL parameters for the new entity
      navigate({
        search: {
          page: 1,
          pageSize: 10
        },
        replace: true,
      })
    }
    prevEntityNameRef.current = entityName
  }, [entityName, navigate])

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

  // Create mutation - using useMutationWithToast for cleaner code
  const createMutation = useMutationWithToast({
    mutationFn: (newItem: any) => EntityApiService.createEntity(entityName, newItem),
    invalidateKey: [`entity-${entityName}-collection`],
    successMessage: 'Item created successfully',
    errorMessage: 'Failed to create item',
    onSuccess: () => setShowCreateDialog(false),
  })

  // Update mutation
  const updateMutation = useMutationWithToast({
    mutationFn: ({ id, item }: { id: string; item: any }) =>
      EntityApiService.updateEntity(entityName, id, item),
    invalidateKey: [`entity-${entityName}-collection`],
    successMessage: 'Item updated successfully',
    errorMessage: 'Failed to update item',
    onSuccess: () => setShowEditDialog(false),
  })

  // Delete mutation
  const deleteMutation = useMutationWithToast({
    mutationFn: (id: string) => EntityApiService.deleteEntity(entityName, id),
    invalidateKey: [`entity-${entityName}-collection`],
    successMessage: 'Item deleted successfully',
    errorMessage: 'Failed to delete item',
    onSuccess: () => setShowDeleteDialog(false),
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
    setSortColumnsInternal(prev => {
      // Create a new object with the updated sort column
      const newSortColumns = { ...prev };

      // If the column is already in the sort columns, update its direction
      // If it's not, add it to the sort columns
      newSortColumns[column] = direction;
      
      // Update URL with new sort
      const sortString = Object.entries(newSortColumns)
        .map(([col, dir]) => `${dir === 'desc' ? '-' : '+'}${col}`)
        .join(',')
      updateUrlParams({ sort: sortString })

      return newSortColumns;
    });
  }, [updateUrlParams]);

  // Clear all sorting
  const clearSorting = useCallback(() => {
    setSortColumnsInternal({});
    updateUrlParams({ sort: '' })
  }, [updateUrlParams]);

  const fetchData = useCallback(() => {
    console.log("CEDP.fetchData")
    refetch()
  }, [refetch])

  // Copy selected items to clipboard in the required format
  const copySelectedItems = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast({
        variant: 'default',
        title: 'No items selected',
        description: 'Please select at least one item to copy.',
      })
      return
    }

    // Fetch each selected item with all relations included
    const deepCopyPromises = selectedItems.map(item => {
      // Get the ID of the item
      const itemId = item.id || item.reference_id
      if (!itemId) {
        console.error('Item has no ID:', item)
        return Promise.resolve(null)
      }
      // Fetch the item with all relations included
      return EntityApiService.fetchSingleEntity(entityName, itemId, { includedRelations: '*' })
    })

    // Wait for all fetches to complete
    const deepCopiedItems = await Promise.all(deepCopyPromises)

    console.log("CEDP.copySelectedItems", deepCopiedItems)
    // Filter out any null items and format them
    const formattedItems = deepCopiedItems
      .filter(item => item !== null)
      .map(item => {
        const formattedItem: Record<string, any> = {}
        // Add all properties from the item
        Object.keys(item).forEach(key => {
          // Skip internal properties that start with underscore
          if (!key.startsWith('_')) {
            formattedItem[key] = item[key]
          }
          if (formattedItem[key] instanceof Array) {
            if (formattedItem[key].length === 0) {
              delete formattedItem[key]
            }
          } else if  (formattedItem[key] instanceof Object) {
            formattedItem[key] = {
              "type": formattedItem[key]["type"],
              "id": formattedItem[key]["reference_id"]
            }
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
  const pasteItems = useCallback(async (clipboardData) => {
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
        SYSTEM_COLUMNS.map(name => delete newItem[name])

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
