import React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { SingleEntityManagementComponent } from '@/features/entity/SingleEntityManagementComponent.tsx'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider.tsx'

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()

  return (
    <SingleEntityDataProvider entityName={entity} entityId={referenceId}>
      <SingleEntityManagementComponent
        entityName={entity}
        entityId={referenceId}
      />
    </SingleEntityDataProvider>
  )
}
