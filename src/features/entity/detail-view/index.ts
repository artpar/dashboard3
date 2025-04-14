// src/features/entity/components/detail-view/index.ts

// Export the main components
export { SingleEntityAllFieldsViewComponent } from './SingleEntityAllFieldsViewComponent.tsx'
export type { EntityDetailViewProps } from './SingleEntityAllFieldsViewComponent.tsx'
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
