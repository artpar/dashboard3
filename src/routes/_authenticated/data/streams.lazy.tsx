import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function StreamsPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="stream"
      title="Streams"
      description="Manage data transformation streams"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/streams')({
  component: StreamsPage,
})
