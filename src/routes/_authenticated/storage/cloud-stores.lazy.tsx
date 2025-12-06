import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function CloudStoresPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="cloud_store"
      title="Cloud Stores"
      description="Manage cloud storage connections"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/storage/cloud-stores')({
  component: CloudStoresPage,
})
