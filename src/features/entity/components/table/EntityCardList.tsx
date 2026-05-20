import React from 'react'
import { Link } from '@tanstack/react-router'
import { EyeIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ColumnDefinition, ColumnViewer } from '@/features/entity/columns'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
import {
  EntityRecord,
  getEntityDetailPath,
  getEntityId,
} from '@/features/entity/utils/entityIdentity'
import EntityEmptyState from './EntityEmptyState'

type EntityCardItem = EntityRecord & Record<string, unknown>

interface EntityCardListProps {
  onDelete: (item: EntityCardItem) => void
}

const TITLE_FIELDS = [
  'name',
  'title',
  'label',
  'email',
  'username',
  'display_name',
]

function getCardTitle(item: EntityCardItem): string {
  for (const field of TITLE_FIELDS) {
    const value = item[field]
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value)
    }
  }

  return getEntityId(item) || 'Untitled record'
}

function getFieldLabel(column: ColumnDefinition): string {
  return column.Name || column.ColumnName.replace(/_/g, ' ')
}

export const EntityCardList: React.FC<EntityCardListProps> = ({ onDelete }) => {
  const {
    data: rawData,
    columns,
    isLoading,
    visibleColumns,
    entityName,
    isItemSelected,
    toggleItemSelection,
  } = useEntityCollectionData()

  const data = rawData as EntityCardItem[]
  const visibleFieldColumns = React.useMemo(() => {
    return columns.filter((column) =>
      visibleColumns.includes(column.ColumnName)
    )
  }, [columns, visibleColumns])

  if (isLoading || columns.length === 0) {
    return (
      <div className='rounded-md border p-2 text-center'>
        <p className='text-muted-foreground'>
          {isLoading ? 'Loading data...' : 'Waiting for columns...'}
        </p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EntityEmptyState
        entityName={entityName}
        className='h-full'
        variant='block'
      />
    )
  }

  return (
    <div className='h-full overflow-auto p-3'>
      <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
        {data.map((item, index) => {
          const itemId = getEntityId(item)
          const detailUrl = getEntityDetailPath(entityName, item)
          const isSelected = isItemSelected(item)

          return (
            <Card
              key={itemId || index}
              className={`rounded-md transition-colors ${isSelected ? 'border-primary bg-muted/30' : ''}`}
            >
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleItemSelection(item)}
                    aria-label={`Select card ${index + 1}`}
                    className='mt-1'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <h3 className='truncate text-sm font-semibold'>
                          {getCardTitle(item)}
                        </h3>
                        {itemId && (
                          <p className='text-muted-foreground mt-0.5 truncate text-xs'>
                            {itemId}
                          </p>
                        )}
                      </div>
                      <div className='flex shrink-0 items-center gap-1'>
                        <Button
                          asChild
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8'
                        >
                          <Link
                            to={detailUrl}
                            aria-label={`View card ${index + 1}`}
                          >
                            <EyeIcon className='h-4 w-4' />
                          </Link>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-destructive hover:text-destructive h-8 w-8'
                          onClick={() => onDelete(item)}
                          aria-label={`Delete card ${index + 1}`}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>

                    <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                      {visibleFieldColumns.map((column) => (
                        <div key={column.ColumnName} className='min-w-0'>
                          <div className='text-muted-foreground truncate text-xs font-medium'>
                            {getFieldLabel(column)}
                          </div>
                          <div className='mt-1 min-w-0 text-sm'>
                            <ColumnViewer
                              column={column}
                              value={item[column.ColumnName]}
                              entity={item}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default EntityCardList
