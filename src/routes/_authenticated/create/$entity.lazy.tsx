import React, { lazy, Suspense } from 'react'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Main } from '@/components/layout/main'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider.tsx'
import EntityCreateHeader from '@/features/entity/components/EntityCreateHeader'
import EntityCreateForm from '@/features/entity/components/EntityCreateForm'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load specialized forms
const CloudStoreForm = lazy(() =>
  import('@/features/storage/components/CloudStoreForm').then((mod) => ({
    default: mod.CloudStoreForm,
  }))
)

const IntegrationForm = lazy(() =>
  import('@/features/integrations/components/IntegrationForm').then((mod) => ({
    default: mod.IntegrationForm,
  }))
)

const MailServerForm = lazy(() =>
  import('@/features/communication/components/MailServerForm').then((mod) => ({
    default: mod.MailServerForm,
  }))
)

// Configuration for specialized entity forms
const SPECIALIZED_CREATE_FORMS: Record<
  string,
  {
    component: React.LazyExoticComponent<React.FC<any>>
    title: string
    description: string
    backLink: string
  }
> = {
  cloud_store: {
    component: CloudStoreForm,
    title: 'New Cloud Store',
    description: 'Connect a new cloud storage provider',
    backLink: '/storage/cloud-stores',
  },
  integration: {
    component: IntegrationForm,
    title: 'New Integration',
    description: 'Connect an external API using OpenAPI or GraphQL specification',
    backLink: '/data/integrations',
  },
  mail_server: {
    component: MailServerForm,
    title: 'New Mail Server',
    description: 'Configure SMTP or IMAP mail server connection',
    backLink: '/communication/email',
  },
}

export const Route = createLazyFileRoute('/_authenticated/create/$entity')({
  component: RouteComponent,
})

/**
 * Route component for entity creation
 * This component has been refactored to use dedicated subcomponents for better organization
 * and to fix the tabs scrolling issue
 */
function RouteComponent() {
  const { entity } = Route.useParams()

  // Check if this entity has a specialized create form
  const specializedConfig = SPECIALIZED_CREATE_FORMS[entity]

  if (specializedConfig) {
    const SpecializedForm = specializedConfig.component
    return (
      <Main className="flex h-screen w-full flex-col overflow-hidden">
        <div className="p-6 pb-4">
          <Link
            to={specializedConfig.backLink}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold">{specializedConfig.title}</h1>
          <p className="text-muted-foreground">
            {specializedConfig.description}
          </p>
        </div>
        <div className="flex-1 overflow-auto px-6 pb-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            }
          >
            <SpecializedForm />
          </Suspense>
        </div>
      </Main>
    )
  }

  // Default generic form for other entities
  return (
    <SingleEntityDataProvider entity={{}} entityId='new' entityName={entity}>
      <Main className='flex h-screen w-full flex-col overflow-hidden'>
        {/* Header component with entity info and navigation */}
        <EntityCreateHeader entityName={entity} />

        {/* Form component in a scrollable container */}
        <EntityCreateForm entityName={entity} />
      </Main>
    </SingleEntityDataProvider>
  )
}
