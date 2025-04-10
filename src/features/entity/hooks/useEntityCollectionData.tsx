// Custom hook to use the entity context
import { useContext } from 'react'
import { CollectionEntityProvider } from '@/features/entity/CollectionEntityProvider.tsx'

export const useEntityCollectionData = () => {
  const context = useContext(CollectionEntityProvider)
  if (context === undefined) {
    throw new Error('useEntityData must be used within an EntityDataProvider')
  }
  return context
}
