import { Link, createLazyFileRoute } from '@tanstack/react-router'
import {
  Download,
  FileInput,
  Table2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const workflows = [
  {
    title: 'Browse app tables',
    description:
      'Open a visible Daptin table through the Raw Entities fallback until the guided data table browser is completed.',
    primitive: 'world and /api/{entity}',
    to: '/world',
    icon: Table2,
  },
  {
    title: 'Import records',
    description:
      'Upload JSON, CSV, or spreadsheet data into a selected Daptin entity.',
    primitive: 'world import_data action',
    to: '/data/import',
    icon: Upload,
  },
  {
    title: 'Export records',
    description:
      'Export records from a selected Daptin entity without using a raw API call.',
    primitive: '/api/{entity} and export actions',
    to: '/data/export',
    icon: Download,
  },
]

function DataHome() {
  return (
    <section className='mx-auto flex w-full max-w-5xl flex-col gap-6 px-2 py-4 sm:px-4'>
      <div className='max-w-3xl space-y-2'>
        <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
          <FileInput className='h-4 w-4' />
          Data
        </div>
        <h1 className='text-2xl font-semibold tracking-normal'>
          App data workflows
        </h1>
        <p className='text-muted-foreground max-w-[70ch] text-sm leading-6'>
          Manage Daptin application records from guided pages first. Raw entity
          browsing remains available as a fallback when a table-specific
          workflow has not been built yet.
        </p>
      </div>

      <div className='divide-y rounded-md border'>
        {workflows.map((workflow) => {
          const Icon = workflow.icon

          return (
            <div
              key={workflow.title}
              className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='flex min-w-0 gap-3'>
                <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-md'>
                  <Icon className='h-4 w-4' />
                </div>
                <div className='min-w-0 space-y-1'>
                  <h2 className='text-sm font-medium'>{workflow.title}</h2>
                  <p className='text-muted-foreground max-w-[70ch] text-sm leading-6'>
                    {workflow.description}
                  </p>
                  <p className='text-muted-foreground font-mono text-xs'>
                    {workflow.primitive}
                  </p>
                </div>
              </div>
              <Button asChild variant='outline' className='shrink-0'>
                <Link to={workflow.to}>Open</Link>
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export const Route = createLazyFileRoute('/_authenticated/data/')({
  component: DataHome,
})
