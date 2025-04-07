import { createLazyFileRoute } from '@tanstack/react-router'
import { EntityManagementComponent } from '@/features/entity'

function EntityManagementForWorkgroup() {
  return (
    <EntityManagementComponent
      entityName='workgroup'
      title='Work groups'
      description='Work groups'
    ></EntityManagementComponent>
  )
}

export const Route = createLazyFileRoute('/_authenticated/workgroups/')({
  component: EntityManagementForWorkgroup,
})
