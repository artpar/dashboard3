// src/features/entity/relations/RelationGroup.tsx
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRelationRecords } from '../hooks/useRelationRecords'
import { RelationRecordsList } from './RelationRecordsList'
import {
  getRelationDirectionStyles,
  getRelationLabel,
  Relation,
  RelationDirection,
} from './relations-utils'

interface RelationGroupProps {
  entityName: string
  entityId?: string
  relation: Relation
  direction?: RelationDirection
}

/**
 * Group component for a specific relation
 */
export function RelationGroup({
  entityName,
  entityId,
  relation,
  direction,
}: RelationGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const relatedEntityName =
    relation.Object === entityName ? relation.Subject : relation.Object

  const dirStyles = getRelationDirectionStyles(
    direction || RelationDirection.Outbound
  )

  const { records, totalCount, isLoading, refetch } = useRelationRecords(
    relation,
    entityName,
    entityId,
    { enabled: isExpanded }
  )

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev)
    if (!isExpanded) {
      refetch()
    }
  }

  return (
    <Card>
      <CardHeader className={`bg-background py-3`}>
        <div className='flex items-center justify-between'>
          <CardTitle
            className={`text-base ${dirStyles.textClass} flex items-center`}
          >
            <span className='font-medium'>{relatedEntityName}</span>
            <span className='mx-2'>•</span>
            <span className='text-sm font-normal'>
              {getRelationLabel(relation.Relation)}
            </span>
          </CardTitle>

          <Button
            variant='ghost'
            size='sm'
            className={dirStyles.textClass}
            onClick={toggleExpand}
          >
            {isExpanded ? (
              <ChevronUp className='h-5 w-5' />
            ) : (
              <div className='flex items-center'>
                <span className='mr-2 text-xs font-medium'>
                  {isLoading ? 'Loading...' : `${totalCount || '?'} items`}
                </span>
                <ChevronDown className='h-5 w-5' />
              </div>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='text-muted-foreground py-6 text-center'>
              Loading related records...
            </div>
          ) : records && records.length > 0 ? (
            <RelationRecordsList
              data={records}
              relatedEntityName={relatedEntityName}
            />
          ) : (
            <div className='m-2 flex p-2'>No records for this relation</div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
