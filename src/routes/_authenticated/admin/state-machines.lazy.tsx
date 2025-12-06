import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function StateMachinesLayout() {
  // Check if we're on a child route (detail page)
  const childMatch = useMatch({
    from: '/_authenticated/admin/state-machines/$smdId',
    shouldThrow: false,
  })

  // If there's a child route match, render the Outlet for the detail page
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the list page
  return (
    <CollectionEntityManagementComponent
      entityName="smd"
      title="State Machines"
      description="Manage state machine definitions"
      displayName="State Machine"
    />
  )
}

export const Route = createLazyFileRoute(
  '/_authenticated/admin/state-machines'
)({
  component: StateMachinesLayout,
})
