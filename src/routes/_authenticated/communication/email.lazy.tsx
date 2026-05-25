import { createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/communication/email')({
  component: () => <Navigate to='/mail/servers' />,
})
