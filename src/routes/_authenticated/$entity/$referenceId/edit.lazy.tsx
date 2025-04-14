import React from 'react'
import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { SingleEntityManagementComponent } from '@/features/entity/SingleEntityManagementComponent.tsx'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider'

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/edit'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()
  const { history } = useRouter()

  const onBack = () => history.go(-1)
  return (
    <SingleEntityDataProvider entityName={entity} entityId={referenceId}>
      <SingleEntityManagementComponent
        entityName={entity}
        entityId={referenceId}
      />
    </SingleEntityDataProvider>
  )
}
