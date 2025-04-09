// src/features/entity/components/relations/index.ts

// Export main components
export { EntityRelations } from './EntityRelations'
export type { EntityRelationsProps, Relation } from './EntityRelations'

// Export utility functions and enums
export {
  RelationDirection,
  getDisplayFields,
  getRelatedEntityName,
  getRelationKey,
  getRelationLabel,
  getRelationDirectionStyles,
  categorizeRelations
} from './relations-utils.ts'

// Export hooks
export { useRelationData } from './useRelationData.ts'
