import { createLazyFileRoute } from '@tanstack/react-router'
import Tasks from '@/features/tasks'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForRpaTasks() {
  return (
    <EntityManagementComponent
      entityName="rpatask"
      title="RPA task"
      description="RPA task"
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/rpatask/')({
  component: EntityManagementForRpaTasks,
})
