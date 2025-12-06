import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function ActionsPage() {
  // Check if we're on a child route (have actionId param)
  const childMatch = useMatch({ from: '/_authenticated/admin/actions/$actionId', shouldThrow: false })

  // If we're on a child route, render the Outlet
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the actions list
  return (
    <CollectionEntityManagementComponent
      entityName="action"
      title="Actions"
      description="Manage workflow actions and automations"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/actions')({
  component: ActionsPage,
})
