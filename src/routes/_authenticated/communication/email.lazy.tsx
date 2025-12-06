import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function EmailPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="mail_server"
      title="Email Servers"
      description="Manage SMTP/IMAP mail servers"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/communication/email')({
  component: EmailPage,
})
