import React from 'react'
import { CollectionEntityManagementComponent } from './CollectionEntityManagementComponent.tsx'

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
    <CollectionEntityManagementComponent
      entityName={entityName}
      title={title}
      description={description}
    />
  )
}

export default EntityManagementIndex

// Export the component and all its related parts for flexibility
export * from './CollectionEntityManagementComponent.tsx'
export { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
