import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function SitesPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="site"
      title="Sites"
      description="Manage static site hosting"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/storage/sites')({
  component: SitesPage,
})
