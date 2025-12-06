import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx'
import { Main } from '@/components/layout/main.tsx'

export function ErrorLoadingEntityPanel(props: {
  entityName: any
  error: any
}) {
  return (
    <Main className='flex h-full w-full flex-col'>
      <div className='mb-6 flex items-center'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {props.entityName} Details
          </h1>
          <p className='text-muted-foreground'>
            View details for this {props.entityName}
          </p>
        </div>
      </div>
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {props.error instanceof Error
            ? props.error.message
            : 'An error occurred while fetching data'}
        </AlertDescription>
      </Alert>
    </Main>
  )
}
