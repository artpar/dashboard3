import { createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute(
  '/_authenticated/communication/email/$serverId'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { serverId } = Route.useParams()
  return <Navigate to='/mail/servers/$serverId' params={{ serverId }} />
}
