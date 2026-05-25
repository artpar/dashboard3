import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { NativeMailServersPage } from '@/features/communication/mail/native-mail'

export const Route = createLazyFileRoute('/_authenticated/mail/servers')({
  component: ServersLayout,
})

function ServersLayout() {
  const detailMatch = useMatch({
    from: '/_authenticated/mail/servers/$serverId',
    shouldThrow: false,
  })

  if (detailMatch) {
    return <Outlet />
  }

  return <NativeMailServersPage />
}
