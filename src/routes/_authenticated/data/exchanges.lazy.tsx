import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function ExchangesPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="data_exchange"
      title="Data Exchanges"
      description="Manage external data synchronization"
      displayName="Data Exchange"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/exchanges')({
  component: ExchangesPage,
})
