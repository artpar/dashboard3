import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForUserAccount() {
  return (
    <EntityManagementComponent
      entityName="user_account"
      title="User accounts"
      description="User accounts"
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/user_account/')({
  component: EntityManagementForUserAccount,
})
