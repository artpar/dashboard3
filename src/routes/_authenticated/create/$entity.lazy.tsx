import { createLazyFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'
import EntityForm from '@/features/entity/components/EntityForm.tsx'
import { CollectionEntityDataProvider } from '@/features/entity/providers/CollectionEntityDataProvider.tsx'

export const Route = createLazyFileRoute('/_authenticated/create/$entity')({
  component: RouteComponent,
})

function RouteComponent() {
  const { entity } = Route.useParams()

  return (
    <CollectionEntityDataProvider entityName={entity}>
      <Main className='flex h-screen w-full flex-col overflow-hidden'>
        <EntityForm
          mode='create'
          onClose={() => {
            console.log('Go back from new ?')
          }}
        ></EntityForm>
      </Main>
    </CollectionEntityDataProvider>
  )
}
