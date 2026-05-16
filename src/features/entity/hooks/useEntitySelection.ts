import { useState, useCallback, useMemo } from 'react'
import { EntityRecord, getEntityId } from '@/features/entity/utils/entityIdentity'

/**
 * Hook for managing entity selection state with optimized performance.
 * Uses a Map internally for O(1) lookups while exposing an array for convenience.
 */
export function useEntitySelection<T extends EntityRecord>(
  data: T[]
) {
  const [selectedItems, setSelectedItems] = useState<T[]>([])

  const selectedItemsMap = useMemo(() => {
    const newMap = new Map<string, T>()
    selectedItems.forEach(item => {
      const itemId = getEntityId(item)
      if (itemId) {
        newMap.set(itemId, item)
      }
    })
    return newMap
  }, [selectedItems])

  const toggleItemSelection = useCallback((item: T) => {
    const itemId = getEntityId(item)
    if (!itemId) {
      return
    }

    setSelectedItems(prevItems => {
      const newMap = new Map<string, T>()
      prevItems.forEach(selectedItem => {
        const selectedItemId = getEntityId(selectedItem)
        if (selectedItemId) {
          newMap.set(selectedItemId, selectedItem)
        }
      })

      if (newMap.has(itemId)) {
        newMap.delete(itemId)
      } else {
        newMap.set(itemId, item)
      }

      return Array.from(newMap.values())
    })
  }, [])

  const areAllItemsSelected = useCallback((items: T[] = data): boolean => {
    return (
      items.length > 0 &&
      items.every(item => {
        const itemId = getEntityId(item)
        return itemId ? selectedItemsMap.has(itemId) : false
      })
    )
  }, [data, selectedItemsMap])

  const toggleAllItems = useCallback((items: T[] = data) => {
    if (areAllItemsSelected(items)) {
      const itemIds = new Set(items.map(getEntityId).filter(Boolean))
      setSelectedItems(prevItems =>
        prevItems.filter(item => !itemIds.has(getEntityId(item)))
      )
    } else {
      setSelectedItems(prevItems => {
        const newMap = new Map<string, T>()
        prevItems.forEach(item => {
          const itemId = getEntityId(item)
          if (itemId) {
            newMap.set(itemId, item)
          }
        })
        items.forEach(item => {
          const itemId = getEntityId(item)
          if (itemId) {
            newMap.set(itemId, item)
          }
        })
        return Array.from(newMap.values())
      })
    }
  }, [areAllItemsSelected, data])

  const selectAllItems = useCallback(() => {
    toggleAllItems(data)
  }, [data, toggleAllItems])

  const clearSelectedItems = useCallback(() => {
    setSelectedItems([])
  }, [])

  const isItemSelected = useCallback((item: T): boolean => {
    const itemId = getEntityId(item)
    return selectedItemsMap.has(itemId)
  }, [selectedItemsMap])

  return {
    selectedItems,
    setSelectedItems,
    selectedItemsMap,
    toggleItemSelection,
    selectAllItems,
    toggleAllItems,
    areAllItemsSelected,
    clearSelectedItems,
    isItemSelected,
  }
}
