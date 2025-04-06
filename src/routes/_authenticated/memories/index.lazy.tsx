import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForMemory() {
  return (
    <EntityManagementComponent
      entityName='memory'
      title='Memories'
      description='Memories'
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/memories/')({
  component: EntityManagementForMemory,
})
