import { useState, useCallback, useEffect } from 'react'

/**
 * Hook for managing entity selection state with optimized performance.
 * Uses a Map internally for O(1) lookups while exposing an array for convenience.
 */
export function useEntitySelection<T extends { id?: string; reference_id?: string }>(
  data: T[]
) {
  const [selectedItems, setSelectedItems] = useState<T[]>([])
  const [selectedItemsMap, setSelectedItemsMap] = useState<Map<string, T>>(new Map())

  // Keep selectedItems array and selectedItemsMap in sync
  useEffect(() => {
    const newMap = new Map<string, T>()
    selectedItems.forEach(item => {
      const itemId = item.id || item.reference_id || ''
      newMap.set(itemId, item)
    })
    setSelectedItemsMap(newMap)
  }, [selectedItems])

  const getItemId = useCallback((item: T): string => {
    return item.id || item.reference_id || ''
  }, [])

  const toggleItemSelection = useCallback((item: T) => {
    const itemId = getItemId(item)

    setSelectedItemsMap(prevMap => {
      const newMap = new Map(prevMap)
      if (newMap.has(itemId)) {
        newMap.delete(itemId)
      } else {
        newMap.set(itemId, item)
      }

      // Update the selectedItems array based on the map
      setSelectedItems(Array.from(newMap.values()))
      return newMap
    })
  }, [getItemId])

  const selectAllItems = useCallback(() => {
    if (selectedItems.length === data.length) {
      // If all items are already selected, clear the selection
      setSelectedItems([])
      setSelectedItemsMap(new Map())
    } else {
      // Otherwise, select all items
      const newMap = new Map<string, T>()
      data.forEach(item => {
        const itemId = getItemId(item)
        newMap.set(itemId, item)
      })
      setSelectedItemsMap(newMap)
      setSelectedItems(data.slice())
    }
  }, [data, selectedItems.length, getItemId])

  const clearSelectedItems = useCallback(() => {
    setSelectedItems([])
    setSelectedItemsMap(new Map())
  }, [])

  const isItemSelected = useCallback((item: T): boolean => {
    const itemId = getItemId(item)
    return selectedItemsMap.has(itemId)
  }, [selectedItemsMap, getItemId])

  return {
    selectedItems,
    setSelectedItems,
    selectedItemsMap,
    toggleItemSelection,
    selectAllItems,
    clearSelectedItems,
    isItemSelected,
  }
}
