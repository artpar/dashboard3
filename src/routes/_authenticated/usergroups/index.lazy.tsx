import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForUserGroup() {
  return (
    <EntityManagementComponent
      entityName="usergroup"
      title="User groups"
      description="User groups"
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/usergroups/')({
  component: EntityManagementForUserGroup,
})
