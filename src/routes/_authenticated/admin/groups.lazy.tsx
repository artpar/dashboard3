import { createLazyFileRoute } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function GroupsPage() {
  return (
    <CollectionEntityManagementComponent
      entityName="usergroup"
      title="Groups"
      description="User groups for bulk permission assignment — define access tiers like editors, viewers, or admins"
      displayName="Group"
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/admin/groups')({
  component: GroupsPage,
})
