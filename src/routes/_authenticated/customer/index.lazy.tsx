import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForCustomer() {
  return (
    <EntityManagementComponent
      entityName="customer"
      title="Customers"
      description="Customer management"
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/customer/')({
  component: EntityManagementForCustomer,
})
