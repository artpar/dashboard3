import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function ExchangesPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="data_exchange"
      title="Data Exchanges"
      description="Bidirectional sync between entities and external systems — push changes to REST APIs, Google Sheets, or trigger actions on data mutations"
      displayName="Data Exchange"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/exchanges')({
  component: ExchangesPage,
})
