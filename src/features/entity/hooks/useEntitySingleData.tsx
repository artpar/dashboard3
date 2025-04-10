// Custom hook to use the single entity context
import { SingleEntityContext } from '../providers/SingleEntityDataProvider'
import { useEntityData } from './useEntityData'

export const useEntitySingleData = () => {
  return useEntityData(
    SingleEntityContext,
    'useEntitySingleData must be used within a SingleEntityDataProvider'
  )
}