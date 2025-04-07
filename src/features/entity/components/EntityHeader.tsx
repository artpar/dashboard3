import React from 'react'
import { Filter, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EntityHeaderProps {
  title: string
  description: string
  availableActions: any[]
  onRefresh: () => void
  onCreateNew: () => void
  onShowFilters: () => void
  entityName: string
}

/**
 * Component for the entity management header with action buttons
 */
export const EntityHeader: React.FC<EntityHeaderProps> = ({
  title,
  description,
  availableActions,
  onRefresh,
  onCreateNew,
  onShowFilters,
  entityName,
}) => {
  return (
    <div className='mb-6 flex flex-col items-start justify-between space-y-4'>
      <div className='flex items-center space-x-4'>
        <h1 className='text-2xl font-bold tracking-tight'>{title}</h1>
      </div>
      <div className='flex space-x-2'>
        <Button onClick={onCreateNew}>
          <Plus className='mr-2 h-4 w-4' />
          Add {entityName}
        </Button>
        <Button variant='outline' size='sm' onClick={onShowFilters}>
          <Filter className='mr-2 h-4 w-4' />
          Filter
        </Button>

        <Button variant='outline' size='sm' onClick={onRefresh}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Refresh
        </Button>

        {/* Actions dropdown if available */}
        {availableActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {availableActions.map((action) => (
                <DropdownMenuItem
                  key={action.id}
                  onClick={() => {
                    console.log(`Execute action`, action)
                  }}
                >
                  {action.label || action.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default EntityHeader
