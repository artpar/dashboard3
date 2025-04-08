import { createFileRoute } from '@tanstack/react-router'
import EntityDetails from '@/features/entity/EntityDetails.tsx'

export const Route = createFileRoute('/_authenticated/memory/$referenceId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId } = Route.useParams()

  return (
    <EntityDetails
      entityName='memory'
      referenceId={referenceId}
    ></EntityDetails>
  )
}
