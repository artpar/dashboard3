import React from 'react'
import { EntityManagementComponent } from './EntityManagement'

// Main entry component that takes an entity name and renders the management interface
interface EntityManagementProps {
  entityName: string
  title?: string
  description?: string
}

const EntityManagementIndex: React.FC<EntityManagementProps> = ({
  entityName,
  title,
  description,
}) => {
  return (
    <EntityManagementComponent
      entityName={entityName}
      title={title}
      description={description}
    />
  )
}

export default EntityManagementIndex

// Export the component and all its related parts for flexibility
export * from './EntityManagement'
export * from './EntityCollectionContext.tsx'
export { useEntityData } from '@/features/entity/hooks/useEntityData.tsx'
