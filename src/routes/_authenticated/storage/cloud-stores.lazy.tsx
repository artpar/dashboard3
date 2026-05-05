import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function CloudStoresLayout() {
  // Check if we're on a child route (detail page)
  const childMatch = useMatch({
    from: '/_authenticated/storage/cloud-stores/$storeId',
    shouldThrow: false,
  })

  // If there's a child route match, render the Outlet for the detail page
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the list page
  return (
    <CollectionEntityManagementComponent
      entityName="cloud_store"
      title="Cloud Stores"
      description="Storage backends configured via rclone — S3, GCS, Azure, Dropbox, local filesystem, and more. Used to back sites and handle file uploads."
      displayName="Cloud Store"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/storage/cloud-stores')({
  component: CloudStoresLayout,
})
