// Custom hook to use the entity context
import { useContext } from 'react'
import { EntityContext } from '@/features/entity/EntityContext.tsx'

export const useEntityData = () => {
  const context = useContext(EntityContext)
  if (context === undefined) {
    throw new Error('useEntityData must be used within an EntityDataProvider')
  }
  return context
}
