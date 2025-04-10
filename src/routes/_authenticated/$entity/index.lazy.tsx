import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForMemory() {
  const { entity } = Route.useParams()

  return (
    <EntityManagementComponent
      entityName={entity}
      title={entity}
      description={entity + ' management'}
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/$entity/')({
  component: EntityManagementForMemory,
})
