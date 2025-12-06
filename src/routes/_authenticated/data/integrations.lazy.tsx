import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function IntegrationsLayout() {
  // Check if we're on a child route (detail page)
  const childMatch = useMatch({
    from: '/_authenticated/data/integrations/$integrationId',
    shouldThrow: false,
  })

  // If there's a child route match, render the Outlet for the detail page
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the list page
  return (
    <CollectionEntityManagementComponent
      entityName="integration"
      title="Integrations"
      description="Manage API integrations using OpenAPI, GraphQL, or custom specifications"
      displayName="Integration"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/integrations')({
  component: IntegrationsLayout,
})
