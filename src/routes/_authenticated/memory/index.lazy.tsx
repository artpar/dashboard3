import { createLazyFileRoute } from '@tanstack/react-router'
import {
  EntityDetailsComponent,
  EntityManagementComponent,
} from '@/features/entity'

function EntityManagementForMemory() {
  return (
    <EntityManagementComponent
      entityName="memory"
      title="Memories"
      description="Memories"
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/memory/')({
  component: EntityManagementForMemory,
})
