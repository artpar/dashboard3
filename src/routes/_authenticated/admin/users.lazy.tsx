import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function UsersPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="user_account"
      title="Users"
      description="User accounts with JWT authentication, group membership, and optional OTP two-factor auth"
      displayName="User"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/users')({
  component: UsersPage,
})
