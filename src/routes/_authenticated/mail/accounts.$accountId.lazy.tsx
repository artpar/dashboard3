import { createLazyFileRoute } from '@tanstack/react-router'
import { NativeMailAccountDetailPage } from '@/features/communication/mail/native-mail'

export const Route = createLazyFileRoute('/_authenticated/mail/accounts/$accountId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { accountId } = Route.useParams()
  return <NativeMailAccountDetailPage accountId={accountId} />
}
