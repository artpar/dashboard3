// src/features/entity/relations/RelationRecordsList.tsx
import { useNavigate } from '@tanstack/react-router'
import { CornerDownRightIcon, ExternalLinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RelationActionsMenu } from './RelationActionsMenu'
import { 
  getDisplayFields, 
  getRelationLabel, 
  TableRelation, 
  RelatedRecord, 
  RelationDirection 
} from './relations-utils'

interface RelationRecordsListProps {
  data: RelatedRecord[]
  entityName: string
  entityId: string
  relatedEntityName: string
  relation: TableRelation
  direction: RelationDirection
  onRelationDeleted: () => void
}

/**
 * Component to display list of related records
 */
export function RelationRecordsList({
  data,
  entityName,
  entityId,
  relatedEntityName,
  relation,
  direction,
  onRelationDeleted,
}: RelationRecordsListProps) {
  const navigate = useNavigate()

  // Handle viewing a related entity
  const handleViewEntity = (entityType: string, entityId: string) => {
    navigate({ to: `/${entityType}/${entityId}` })
  }

  // Show empty state
  if (!data?.length) {
    return (
      <div className='flex flex-col items-center justify-center space-y-2 py-6'>
        <CornerDownRightIcon
          className='text-muted-foreground/60 h-10 w-10'
          strokeWidth={1.5}
        />
        <p className='text-muted-foreground text-sm'>
          No related records found
        </p>
      </div>
    )
  }

  // Show records
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-64'>Identifier</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className='text-right w-[180px]'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const displayFields = getDisplayFields(item)

            return (
              <TableRow key={item.reference_id} className='group'>
                <TableCell className='font-mono'>
                  <div className='flex flex-col space-y-1'>
                    <Badge variant='outline' className='w-fit'>
                      {item.reference_id.substring(0, 8)}...
                    </Badge>
                    <div className='flex items-center space-x-2'>
                      <span className='text-muted-foreground text-xs'>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {relation.Relation && (
                        <Badge variant='secondary' className='text-xs'>
                          {getRelationLabel(relation.Relation)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className='space-y-2'>
                    {Object.entries(displayFields).map(([key, value]) => (
                      <div key={key} className='text-sm'>
                        <span className='text-muted-foreground font-medium'>
                          {key}:{' '}
                        </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='text-right group-hover:opacity-100'>
                  <div className='flex items-center justify-end space-x-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        handleViewEntity(relatedEntityName, item.reference_id)
                      }
                      className='opacity-0 transition-opacity group-hover:opacity-100'
                    >
                      <ExternalLinkIcon className='mr-1 h-3.5 w-3.5' />
                      View
                    </Button>

                    <RelationActionsMenu
                      entityName={entityName}
                      entityId={entityId}
                      relatedEntityName={relatedEntityName}
                      record={item}
                      relation={relation}
                      direction={direction}
                      onRelationDeleted={onRelationDeleted}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
