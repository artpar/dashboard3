import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function StreamsPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="stream"
      title="Streams"
      description="Data transformation pipelines that process, filter, or route records between entities and external systems"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/streams')({
  component: StreamsPage,
})
