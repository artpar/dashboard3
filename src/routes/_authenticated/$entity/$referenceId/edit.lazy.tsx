import { createLazyFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main.tsx'
import { SingleEntityProvider } from '@/features/entity/SingleEntityProvider.tsx'
import EntityForm from '@/features/entity/components/EntityForm.tsx'

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/edit'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()

  return (
    <SingleEntityProvider entityName={entity} entityId={referenceId}>
      <Main className='flex h-screen w-full flex-col overflow-hidden'>
        <EntityForm
          mode='edit'
          onClose={() => {
            console.log('Go back from new ?')
          }}
        ></EntityForm>
      </Main>
    </SingleEntityProvider>
  )
}
