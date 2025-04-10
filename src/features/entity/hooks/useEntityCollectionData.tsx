// Custom hook to use the collection entity context
import { CollectionEntityContext } from '../providers/CollectionEntityDataProvider'
import { useEntityData } from './useEntityData'

export const useEntityCollectionData = () => {
  return useEntityData(
    CollectionEntityContext,
    'useEntityCollectionData must be used within a CollectionEntityDataProvider'
  )
}