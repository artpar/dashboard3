import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function CertificatesLayout() {
  // Check if we're on a child route (detail page)
  const childMatch = useMatch({
    from: '/_authenticated/storage/certificates/$certId',
    shouldThrow: false,
  })

  // If there's a child route match, render the Outlet for the detail page
  if (childMatch) {
    return <Outlet />
  }

  // Otherwise render the list page
  return (
    <CollectionEntityManagementComponent
      entityName="certificate"
      title="Certificates"
      description="SSL/TLS certificates for HTTPS connections and DKIM email signing"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/storage/certificates')({
  component: CertificatesLayout,
})
