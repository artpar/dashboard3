import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function IntegrationsPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="integration"
      title="Integrations"
      description="Manage API integrations"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/integrations')({
  component: IntegrationsPage,
})
