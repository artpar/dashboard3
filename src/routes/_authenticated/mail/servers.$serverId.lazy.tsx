import { createLazyFileRoute } from '@tanstack/react-router'
import { NativeMailServerDetailPage } from '@/features/communication/mail/native-mail'

export const Route = createLazyFileRoute('/_authenticated/mail/servers/$serverId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { serverId } = Route.useParams()
  return <NativeMailServerDetailPage serverId={serverId} />
}
