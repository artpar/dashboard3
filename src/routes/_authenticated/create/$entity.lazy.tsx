import React from 'react'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge.tsx'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx'
import { Main } from '@/components/layout/main'
import EntityForm from '@/features/entity/components/EntityForm.tsx'
import { SingleEntityDataProvider } from '@/features/entity/providers/SingleEntityDataProvider.tsx'
import {
  formatDate,
  formatDateTime,
} from '@/features/entity/utils/entityFormatters.tsx'

export const Route = createLazyFileRoute('/_authenticated/create/$entity')({
  component: RouteComponent,
})

function RouteComponent() {
  const { entity } = Route.useParams()

  function handleBack(): void {
    throw new Error('Function not implemented.')
  }

  function handleEdit(): void {
    throw new Error('Function not implemented.')
  }

  function handleDelete(): void {
    throw new Error('Function not implemented.')
  }

  return (
    <SingleEntityDataProvider entity={{}} entityId='new' entityName={entity}>
      <Main className='flex h-screen w-full flex-col overflow-hidden'>
        <div className='flex-shrink-0'>
          <div className='flex items-start justify-between space-y-4'>
            <div className='flex items-center space-x-2'>
              <Link to='..' className='h-8 w-8 p-2'>
                <ArrowLeft className='h-4 w-4' />
                <span className='sr-only'>Back</span>
              </Link>

              <div className='flex items-center'>
                <div className='breadcrumbs text-muted-foreground text-sm'>
                  <span
                    className='cursor-pointer hover:underline'
                    onClick={handleBack}
                  >
                    {entity}
                  </span>
                  <ChevronRight className='mx-1 inline h-4 w-4' />
                  <span className='text-foreground font-medium'>New</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entity header with icon/avatar */}
        <div className='mb-4 flex items-start space-x-4'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight'>{entity}</h1>

            <div className='text-muted-foreground flex flex-wrap items-center gap-2 text-sm'>
              <Badge variant='outline' className='font-normal'>
                {entity}
              </Badge>

              {entity.status && (
                <Badge variant='secondary' className='capitalize'>
                  {entity.status}
                </Badge>
              )}

              {
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='flex items-center space-x-1 text-xs'>
                        <Clock className='h-3 w-3' />
                        <span>Created {formatDate(new Date())}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Created at {formatDateTime(new Date())}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              }

              <div className='flex items-center space-x-1 text-xs'>
                <User className='h-3 w-3' />
                <span>Owner: You</span>
              </div>
            </div>
          </div>
        </div>
        <EntityForm
          mode='create'
          onClose={() => {
            console.log('Go back from new ?')
          }}
        ></EntityForm>
      </Main>
    </SingleEntityDataProvider>
  )
}
