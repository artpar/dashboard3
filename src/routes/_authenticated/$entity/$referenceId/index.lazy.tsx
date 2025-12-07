import React from 'react'
import { createLazyFileRoute, Navigate } from '@tanstack/react-router'
import { SingleEntityManagementComponent } from '@/features/entity/SingleEntityManagementComponent.tsx'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider.tsx'

// Map of entity names to their specialized routes
// When navigating to /{entity}/{id}, redirect to the specialized route if one exists
const SPECIALIZED_ENTITY_ROUTES: Record<string, string> = {
  cloud_store: '/storage/cloud-stores',
  site: '/storage/sites',
  integration: '/data/integrations',
  smd: '/admin/state-machines',
  action: '/admin/actions',
  mail_server: '/communication/email',
}

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()

  // Check if this entity has a specialized route
  const specializedRoute = SPECIALIZED_ENTITY_ROUTES[entity]
  if (specializedRoute) {
    return <Navigate to={`${specializedRoute}/${referenceId}`} />
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
