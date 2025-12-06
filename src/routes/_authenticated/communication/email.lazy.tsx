import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function EmailLayout() {
  // Check if we're on a child route (detail page)
  const childMatch = useMatch({
    from: '/_authenticated/communication/email/$serverId',
    shouldThrow: false,
  })

  // If there's a child route match, render the Outlet for the detail page
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the list page
  return (
    <CollectionEntityManagementComponent
      entityName="mail_server"
      title="Email Servers"
      description="Manage SMTP/IMAP mail servers"
      displayName="Mail Server"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/communication/email')({
  component: EmailLayout,
})
