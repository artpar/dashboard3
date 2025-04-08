import { createFileRoute } from '@tanstack/react-router'
import EntityDetails from '@/features/entity/EntityDetails.tsx'

export const Route = createFileRoute('/_authenticated/usergroup/$referenceId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId } = Route.useParams()

  return (
    <EntityDetails
      entityName="usergroup"
      referenceId={referenceId}
    ></EntityDetails>
  )
}
