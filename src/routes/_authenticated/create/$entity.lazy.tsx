import React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider.tsx'
import EntityCreateHeader from '@/features/entity/components/EntityCreateHeader'
import EntityCreateForm from '@/features/entity/components/EntityCreateForm'

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
