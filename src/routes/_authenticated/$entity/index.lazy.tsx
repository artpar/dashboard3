import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function EntityManagementForMemory() {
  const { entity } = Route.useParams()

  return (
    <CollectionEntityManagementComponent
      entityName={entity}
      title={entity}
      description={entity + ' management'}
    ></CollectionEntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/$entity/')({
  component: EntityManagementForMemory,
})
