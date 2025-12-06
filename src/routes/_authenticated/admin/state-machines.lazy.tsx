import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function StateMachinesPage() {
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
  component: StateMachinesPage,
})
