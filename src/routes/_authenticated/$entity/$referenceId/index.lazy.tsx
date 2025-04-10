import { createLazyFileRoute } from '@tanstack/react-router'
import SingleEntityManagementComponent from '@/features/entity/SingleEntityManagementComponent.tsx'

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()

  return (
    <SingleEntityManagementComponent
      entityName={entity}
      referenceId={referenceId}
    ></SingleEntityManagementComponent>
  )
}
