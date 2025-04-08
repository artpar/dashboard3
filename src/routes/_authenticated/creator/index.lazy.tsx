import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForCreator() {
  return (
    <EntityManagementComponent
      entityName="creator"
      title="Creators"
      description="Creator management"
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/creator/')({
  component: EntityManagementForCreator,
})
