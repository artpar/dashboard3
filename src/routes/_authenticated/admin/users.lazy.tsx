import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function UsersPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="user_account"
      title="Users"
      description="Manage user accounts"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/users')({
  component: UsersPage,
})
