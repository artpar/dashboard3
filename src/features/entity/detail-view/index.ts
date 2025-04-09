// src/features/entity/components/detail-view/index.ts

// Export the main components
export { EntityDetailView } from './EntityDetailView'
export type { EntityDetailViewProps } from './EntityDetailView'
export { EntityFieldGroup } from './EntityFieldGroup'
export { EntityDetailField } from './EntityDetailField'
export { EntityViewHeader } from './EntityViewHeader'

// Export utility functions
export {
  getFieldLabel,
  formatColumnName,
  filterFieldsBySearch,
  getAllFields,
  isEmptyValue,
  groupColumnsByCategory,
} from './entity-detail-utils'
