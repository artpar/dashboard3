import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { NativeMailHomePage } from '@/features/communication/mail/native-mail'

export const Route = createLazyFileRoute('/_authenticated/mail')({
  component: MailLayout,
})

function MailLayout() {
  const serversMatch = useMatch({
    from: '/_authenticated/mail/servers',
    shouldThrow: false,
  })
  const accountsMatch = useMatch({
    from: '/_authenticated/mail/accounts',
    shouldThrow: false,
  })
  const outboxMatch = useMatch({
    from: '/_authenticated/mail/outbox',
    shouldThrow: false,
  })

  if (serversMatch || accountsMatch || outboxMatch) {
    return <Outlet />
  }

  return <NativeMailHomePage />
}
