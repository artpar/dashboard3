import { createLazyFileRoute, Outlet, useMatch } from '@tanstack/react-router'
import { CollectionEntityManagementComponent } from '@/features/entity'

function TemplatesLayout() {
  const childMatch = useMatch({
    from: '/_authenticated/templates/$templateId',
    shouldThrow: false,
  })

  if (childMatch) {
    return <Outlet />
  }

  return (
    <CollectionEntityManagementComponent
      entityName='template'
      title='Templates'
      description='Reusable response and page templates stored in Daptin. Use them to inspect template content, routing patterns, headers, and action/cache configuration.'
      displayName='Template'
    />
  )
}

export const Route = createLazyFileRoute('/_authenticated/templates')({
  component: TemplatesLayout,
})
