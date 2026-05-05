import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function OAuthPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="oauth_connect"
      title="OAuth Connections"
      description="Configure external identity providers (Google, GitHub, Microsoft) for social login or accessing external APIs on behalf of users"
      displayName="OAuth Connection"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/communication/oauth')({
  component: OAuthPage,
})
