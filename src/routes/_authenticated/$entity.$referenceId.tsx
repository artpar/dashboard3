import { createFileRoute } from '@tanstack/react-router'
import EntityDetails from '@/features/entity/EntityDetails.tsx'

export const Route = createFileRoute('/_authenticated/$entity/$referenceId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()

  return (
    <EntityDetails
      entityName={entity}
      referenceId={referenceId}
    ></EntityDetails>
  )
}
