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
import { EntityRecord, getEntityId } from '@/features/entity/utils/entityIdentity'

type SortDirection = 'asc' | 'desc'
type EntityItem = EntityRecord & Record<string, unknown>
type EntityFilters = Record<string, unknown>

// Define the collection entity context type
export interface CollectionEntityContextType extends BaseEntityContextType {
  data: EntityItem[]
  selectedItem: EntityItem | null
  setSelectedItem: (item: EntityItem | null) => void
  selectedItems: EntityItem[]
  setSelectedItems: (items: EntityItem[]) => void
  toggleItemSelection: (item: EntityItem) => void
  selectAllItems: () => void
  toggleAllVisibleItems: () => void
  areAllVisibleItemsSelected: boolean
  clearSelectedItems: () => void
  isItemSelected: (item: EntityItem) => boolean
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
  filters: EntityFilters
  setFilters: (filters: EntityFilters) => void
  sortColumns: Record<string, SortDirection>
  setSortColumns: (columns: Record<string, SortDirection>) => void
  setSortColumn: (column: string, direction: SortDirection) => void
  toggleSortColumn: (column: string) => void
  removeSortColumn: (column: string) => void
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
  clipboardData: EntityItem[] | null
  setClipboardData: (data: EntityItem[] | null) => void
  copySelectedItems: () => void
  pasteItems: (clipboardData?: EntityItem[] | null) => Promise<void>
  fetchData: () => void
  createItem: (item: EntityItem) => Promise<unknown>
  updateItem: (id: string, item: EntityItem) => Promise<unknown>
  deleteItem: (id: string) => Promise<unknown>
  bulkDeleteItems: (ids: string[]) => Promise<unknown>
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

  const [data, setData] = useState<EntityItem[]>([])
  const [selectedItem, setSelectedItem] = useState<EntityItem | null>(null)
  const {
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    selectAllItems,
    toggleAllItems,
    areAllItemsSelected,
    clearSelectedItems,
    isItemSelected,
  } = useEntitySelection<EntityItem>(data)
  
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
  
  const [filters, setFiltersInternal] = useState<EntityFilters>(parseFiltersFromUrl())
  const [sortColumns, setSortColumnsInternal] = useState<Record<string, SortDirection>>(parseSortFromUrl())
  
  const [clipboardData, setClipboardData] = useState<EntityItem[] | null>(null)

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
    filters?: EntityFilters
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
  
  const setFilters = useCallback((newFilters: EntityFilters) => {
    setFiltersInternal(newFilters)
    setCurrentPageInternal(1) // Reset to first page when filtering
    updateUrlParams({ filters: newFilters, page: 1 })
  }, [updateUrlParams])
  
  const setSortColumns = useCallback((newSort: Record<string, SortDirection>) => {
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
    mutationFn: (newItem: EntityItem) => EntityApiService.createEntity(entityName, newItem),
    invalidateKey: [`entity-${entityName}-collection`],
    successMessage: 'Item created successfully',
    errorMessage: 'Failed to create item',
    onSuccess: () => setShowCreateDialog(false),
  })

  // Update mutation
  const updateMutation = useMutationWithToast({
    mutationFn: ({ id, item }: { id: string; item: EntityItem }) =>
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
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete items',
        description: error instanceof Error ? error.message : 'An error occurred',
      })
    },
  })

  // Exposed functions
  const createItem = async (item: EntityItem) => {
    return createMutation.mutateAsync(item)
  }

  const updateItem = async (id: string, item: EntityItem) => {
    return updateMutation.mutateAsync({ id, item })
  }

  const deleteItem = async (id: string) => {
    return deleteMutation.mutateAsync(id)
  }

  const bulkDeleteItems = async (ids: string[]) => {
    return bulkDeleteMutation.mutateAsync(ids)
  }

  const areAllVisibleItemsSelected = areAllItemsSelected(data)

  const toggleAllVisibleItems = useCallback(() => {
    toggleAllItems(data)
  }, [data, toggleAllItems])

  // Set sort column
  const setSortColumn = useCallback((column: string, direction: SortDirection) => {
    setSortColumnsInternal(prev => {
      const newSortColumns = { ...prev, [column]: direction }

      const sortString = Object.entries(newSortColumns)
        .map(([col, dir]) => `${dir === 'desc' ? '-' : '+'}${col}`)
        .join(',')
      updateUrlParams({ sort: sortString })

      return newSortColumns
    })
  }, [updateUrlParams])

  const removeSortColumn = useCallback((column: string) => {
    setSortColumnsInternal(prev => {
      const newSortColumns = { ...prev }
      delete newSortColumns[column]

      const sortString = Object.entries(newSortColumns)
        .map(([col, dir]) => `${dir === 'desc' ? '-' : '+'}${col}`)
        .join(',')
      updateUrlParams({ sort: sortString })

      return newSortColumns
    })
  }, [updateUrlParams])

  const toggleSortColumn = useCallback((column: string) => {
    setSortColumnsInternal(prev => {
      const currentDirection = prev[column]
      const newSortColumns = { ...prev }

      if (!currentDirection) {
        newSortColumns[column] = 'asc'
      } else if (currentDirection === 'asc') {
        newSortColumns[column] = 'desc'
      } else {
        delete newSortColumns[column]
      }

      const sortString = Object.entries(newSortColumns)
        .map(([col, dir]) => `${dir === 'desc' ? '-' : '+'}${col}`)
        .join(',')
      updateUrlParams({ sort: sortString })

      return newSortColumns
    })
  }, [updateUrlParams])

  // Clear all sorting
  const clearSorting = useCallback(() => {
    setSortColumnsInternal({});
    updateUrlParams({ sort: '' })
  }, [updateUrlParams]);

  const fetchData = useCallback(() => {
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
      const itemId = getEntityId(item)
      if (!itemId) {
        return Promise.resolve(null)
      }
      // Fetch the item with all relations included
      return EntityApiService.fetchSingleEntity(entityName, itemId, { includedRelations: '*' })
    })

    // Wait for all fetches to complete
    const deepCopiedItems = await Promise.all(deepCopyPromises)

    // Filter out any null items and format them
    const formattedItems = deepCopiedItems
      .filter(item => item !== null)
      .map(item => {
        const formattedItem: EntityItem = {}
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
      }).catch(() => {
        toast({
          variant: 'destructive',
          title: 'Copy failed',
          description: 'Could not copy to system clipboard. Data is still available for internal paste.',
        })
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not format data for clipboard.',
      })
    }
  }, [selectedItems, toast])

  // Paste items from clipboard
  const pasteItems = useCallback(async (clipboardData) => {
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
    toggleAllVisibleItems,
    areAllVisibleItemsSelected,
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
    setSortColumns,
    setSortColumn,
    toggleSortColumn,
    removeSortColumn,
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
