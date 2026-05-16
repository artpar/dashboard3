import React from 'react'
import { createLazyFileRoute, Navigate } from '@tanstack/react-router'
import { SingleEntityManagementComponent } from '@/features/entity/SingleEntityManagementComponent.tsx'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider.tsx'
import { getEntityDetailPath } from '@/features/entity/utils/entityIdentity'

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()

  const detailPath = getEntityDetailPath(entity, referenceId)
  if (detailPath !== `/${entity}/${referenceId}`) {
    return <Navigate to={detailPath} />
  }

  return (
    <SingleEntityDataProvider entityName={entity} entityId={referenceId}>
      <SingleEntityManagementComponent
        entityName={entity}
        entityId={referenceId}
      />
    </SingleEntityDataProvider>
  )
}
