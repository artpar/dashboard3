import {
  EntityRelationsContext,
  EntityRelationsContextType,
} from '../providers/EntityRelationsProvider'
import { useEntityData } from './useEntityData'

/**
 * Hook to access entity relations data and operations
 */
export const useEntityRelations = (): EntityRelationsContextType => {
  return useEntityData<EntityRelationsContextType>(
    EntityRelationsContext,
    'useEntityRelations must be used within an EntityRelationsProvider'
  )
}
