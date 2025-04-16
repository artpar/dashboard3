// src/features/entity/components/detail-view/EntityFieldGroup.tsx
import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ColumnDefinition } from '@/features/entity/columns'
import { FieldGroup } from '@/features/entity/types'
import { EntityDetailField } from './EntityDetailField'


interface EntityFieldGroupProps {
  group: FieldGroup
  columns: ColumnDefinition[]
  entityItem: any
  expandedFields: Record<string, boolean>
  toggleFieldExpansion: (fieldName: string) => void
  enableFieldExpansion: boolean
}

/**
 * Displays a group of entity fields in a card with collapsible sections
 */
export function EntityFieldGroup({
  group,
  columns,
  entityItem,
  expandedFields,
  toggleFieldExpansion,
  enableFieldExpansion,
}: EntityFieldGroupProps) {
  const [isGroupOpen, setIsGroupOpen] = useState(true)

  // Skip empty groups unless they have a special renderEmpty function
  if (group.fields.length === 0 && !group.renderEmpty) {
    return null
  }

  const getColumnObj = (fieldName: string) => {
    return columns.find((col) => col.ColumnName === fieldName)
  }

  return (
    <Collapsible
      open={isGroupOpen}
      onOpenChange={setIsGroupOpen}
      className={cn('transition-all duration-200 h-full', group.colorClass)}
    >
      <Card
        className={cn(
          group.variant === 'flat' ? 'border-0 bg-transparent shadow-none' : '',
          group.highlighted && 'border-primary/20',
          "h-full"
        )}
      >
        <CollapsibleTrigger asChild>
          <CardHeader
            className={cn(
              'flex flex-row items-center justify-between space-y-0 px-4 py-3',
              group.headerClass,
              group.highlighted && 'bg-primary/5'
            )}
          >
            <div className='flex items-center gap-2'>
              {group.icon && (
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    group.iconBgClass || 'bg-primary/10'
                  )}
                >
                  {group.icon}
                </div>
              )}
              <CardTitle
                className={cn('text-base font-medium', group.titleClass)}
              >
                {group.title}
                {group.badge && (
                  <Badge variant='outline' className='ml-2'>
                    {group.badge}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <Button variant='ghost' size='sm' className='gap-1'>
              <span className='text-xs'>{isGroupOpen ? 'Hide' : 'Show'}</span>
              <ChevronDownIcon
                className={cn(
                  'h-4 w-4 transition-transform',
                  isGroupOpen ? 'rotate-180' : ''
                )}
              />
            </Button>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent
            className={cn(
              'px-0 pt-0',
              !isGroupOpen && 'hidden' // Ensure content is fully hidden when collapsed
            )}
          >
            {group.fields.length === 0 && group.renderEmpty ? (
              <div className='p-4'>{group.renderEmpty()}</div>
            ) : (
              <div className='rounded-b-lg'>
                <div className='divide-y'>
                  {group.fields.map((fieldName, idx) => {
                    const column = getColumnObj(fieldName)

                    if (!column) return null

                    return (
                      <EntityDetailField
                        key={fieldName}
                        fieldName={fieldName}
                        column={column}
                        value={entityItem[fieldName]}
                        entity={entityItem}
                        index={idx}
                        isExpanded={!!expandedFields[fieldName]}
                        onToggleExpand={() => toggleFieldExpansion(fieldName)}
                        enableExpansion={enableFieldExpansion}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
