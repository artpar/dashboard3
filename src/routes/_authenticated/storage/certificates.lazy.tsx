import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function CertificatesPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="certificate"
      title="Certificates"
      description="Manage SSL/TLS certificates"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/storage/certificates')({
  component: CertificatesPage,
})
