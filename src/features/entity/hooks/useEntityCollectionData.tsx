// Custom hook to use the entity context
import { useContext } from 'react'
import { EntityCollectionContext } from '@/features/entity/EntityCollectionContext.tsx'

export const useEntityCollectionData = () => {
  const context = useContext(EntityCollectionContext)
  if (context === undefined) {
    throw new Error('useEntityData must be used within an EntityDataProvider')
  }
  return context
}
