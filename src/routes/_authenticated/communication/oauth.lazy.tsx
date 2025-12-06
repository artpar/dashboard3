import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function OAuthPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="oauth_connect"
      title="OAuth Connections"
      description="Manage OAuth providers and connections"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/communication/oauth')({
  component: OAuthPage,
})
