// Custom hook to use the entity context
import { useContext } from 'react'
import { CollectionEntityDataProvider } from '@/features/entity/CollectionEntityDataProvider.tsx'

export const useEntityCollectionData = () => {
  const context = useContext(CollectionEntityDataProvider)
  if (context === undefined) {
    throw new Error('useEntityData must be used within an EntityDataProvider')
  }
  return context
}
