import { createFileRoute } from '@tanstack/react-router'
import EntityDetails from '@/features/entity/EntityDetails.tsx'

export const Route = createFileRoute('/_authenticated/rpatask/$referenceId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId } = Route.useParams()

  return (
    <EntityDetails
      entityName="rpatask"
      referenceId={referenceId}
    ></EntityDetails>
  )
}
