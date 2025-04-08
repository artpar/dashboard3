import { createFileRoute } from '@tanstack/react-router'
import EntityDetails from '@/features/entity/EntityDetails.tsx'

export const Route = createFileRoute(
  '/_authenticated/user_account/$referenceId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId } = Route.useParams()

  return (
    <EntityDetails
      entityName="user_account"
      referenceId={referenceId}
    ></EntityDetails>
  )
}
