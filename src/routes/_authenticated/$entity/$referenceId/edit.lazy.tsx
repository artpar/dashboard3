import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { Main } from '@/components/layout/main.tsx'
import EntityForm from '@/features/entity/components/EntityForm.tsx'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider'

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/edit'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()
  const { history } = useRouter()

  const onBack = () => history.go(-1)
  return (
    <SingleEntityDataProvider entityName={entity} entityId={referenceId}>
      <Main className='flex h-screen w-full flex-col overflow-hidden'>
        <EntityForm mode='edit' onClose={onBack}></EntityForm>
      </Main>
    </SingleEntityDataProvider>
  )
}
