import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function SitesLayout() {
  // Check if we're on a child route (detail page)
  const childMatch = useMatch({
    from: '/_authenticated/storage/sites/$siteId',
    shouldThrow: false,
  })

  // If there's a child route match, render the Outlet for the detail page
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the list page
  return (
    <CollectionEntityManagementComponent
      entityName="site"
      title="Sites"
      description="Manage static site hosting"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/storage/sites')({
  component: SitesLayout,
})
