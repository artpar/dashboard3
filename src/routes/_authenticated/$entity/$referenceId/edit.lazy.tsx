import { createLazyFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main.tsx'
import { EntityCollectionDataProvider } from '@/features/entity'
import EntityForm from '@/features/entity/components/EntityForm.tsx'

export const Route = createLazyFileRoute(
  '/_authenticated/$entity/$referenceId/edit'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { referenceId, entity } = Route.useParams()

  return (
    <EntityCollectionDataProvider entityName={entity}>
      <Main className='flex h-screen w-full flex-col overflow-hidden'>
        <EntityForm
          mode='create'
          entity={entity}
          entityItem={referenceId}
          onClose={() => {
            console.log('Go back from new ?')
          }}
        ></EntityForm>
      </Main>
    </EntityCollectionDataProvider>
  )
}
