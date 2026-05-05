import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function EntityManagementForMemory() {
  const { entity } = Route.useParams()
  const title = entity.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <CollectionEntityManagementComponent
      entityName={entity}
      title={title}
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/$entity/')({
  component: EntityManagementForMemory,
})
