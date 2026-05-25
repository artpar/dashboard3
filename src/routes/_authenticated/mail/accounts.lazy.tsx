import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { NativeMailAccountsPage } from '@/features/communication/mail/native-mail'

export const Route = createLazyFileRoute('/_authenticated/mail/accounts')({
  component: AccountsLayout,
})

function AccountsLayout() {
  const detailMatch = useMatch({
    from: '/_authenticated/mail/accounts/$accountId',
    shouldThrow: false,
  })

  if (detailMatch) {
    return <Outlet />
  }

  return <NativeMailAccountsPage />
}
