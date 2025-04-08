import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForArticle() {
  return (
    <EntityManagementComponent
      entityName="article"
      title="Articles"
      description="Article management"
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/article/')({
  component: EntityManagementForArticle,
})
