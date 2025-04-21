import React from 'react'
import { EntityManagementContent, EntityManagementProps } from '@/features/entity/EntityManagementContent.tsx'
import { CollectionEntityDataProvider } from '@/features/entity/providers/CollectionEntityDataProvider.tsx'

/**
 * Container component that wraps the data provider
 */
export const CollectionEntityManagementComponent: React.FC<
  EntityManagementProps
> = ({ entityName, title, description }) => {
  return (
    <CollectionEntityDataProvider entityName={entityName}>
      <EntityManagementContent
        entityName={entityName}
        title={
          title ||
          `${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`
        }
        description={description || `Manage ${entityName} records`}
      />
    </CollectionEntityDataProvider>
  )
}

export default CollectionEntityManagementComponent
