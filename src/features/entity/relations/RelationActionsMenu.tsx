// src/features/entity/relations/RelationActionsMenu.tsx
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangleIcon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TableRelation, RelatedRecord, RelationDirection } from './relations-utils'
import { RelationsApiService } from '../services/RelationsApiService'
import { UpdateBelongsToDialog } from './UpdateBelongsToDialog'

interface RelationActionsMenuProps {
  entityName: string
  entityId: string
  relatedEntityName: string
  record: RelatedRecord
  relation: TableRelation
  direction: RelationDirection
  onRelationDeleted: () => void
}

/**
 * Dropdown menu with actions for a related record
 */
export function RelationActionsMenu({
  entityName,
  entityId,
  relatedEntityName,
  record,
  relation,
  direction,
  onRelationDeleted,
}: RelationActionsMenuProps) {
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(record.reference_id)
    toast({
      title: 'ID Copied',
      description: 'The record ID has been copied to your clipboard.',
      duration: 2000,
    })
  }

  const handleDeleteRelation = async () => {
    try {
      setIsDeleting(true)

      // Determine source and target based on relation direction
      let sourceEntityName, sourceEntityId, targetEntityName, targetEntityId

      if (direction === RelationDirection.Outbound) {
        sourceEntityName = entityName
        sourceEntityId = entityId
        targetEntityName = relatedEntityName
        targetEntityId = record.reference_id
      } else {
        sourceEntityName = relatedEntityName
        sourceEntityId = record.reference_id
        targetEntityName = entityName
        targetEntityId = entityId
      }

      await RelationsApiService.deleteRelation(
        sourceEntityName,
        sourceEntityId,
        targetEntityName,
        targetEntityId,
        relation
      )

      toast({
        title: 'Relation Removed',
        description: `Successfully removed relation with ${relatedEntityName}`,
      })

      setIsDeleteDialogOpen(false)
      onRelationDeleted()
    } catch (error) {
      console.error('Error deleting relation:', error)
      toast({
        title: 'Failed to Remove Relation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100'
          >
            <MoreHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[180px]'>
          <DropdownMenuItem asChild>
            <Link to={`/${relatedEntityName}/${record.reference_id}`}>
              <ExternalLinkIcon className='mr-2 h-4 w-4' />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/${relatedEntityName}/${record.reference_id}/edit`}>
              <PencilIcon className='mr-2 h-4 w-4' />
              Edit Record
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyId}>
            <CopyIcon className='mr-2 h-4 w-4' />
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {relation.Relation === 'belongs_to' ? (
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
              <UpdateBelongsToDialog
                entityName={entityName}
                entityId={entityId}
                relation={relation}
                direction={direction}
                currentRelatedId={record.reference_id}
                onSuccess={onRelationDeleted}
                buttonVariant="ghost"
                buttonSize="sm"
                buttonText="Change Relation"
              />
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setIsDeleteDialogOpen(true)}
              className='text-red-600 focus:text-red-600'
            >
              <TrashIcon className='mr-2 h-4 w-4' />
              Remove Relation
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Relation</AlertDialogTitle>
            <AlertDialogDescription>
              {relation.Relation === 'belongs_to' ? (
                <>This is a required relation and cannot be removed. You can only change it to another {relatedEntityName}.</>  
              ) : (
                <>Are you sure you want to remove this relation? This will not delete the {relatedEntityName} record itself, only its relationship with the current entity.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteRelation()
              }}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className='mr-2 h-4 w-4 animate-spin' />
                  Removing...
                </>
              ) : (
                <>
                  <AlertTriangleIcon className='mr-2 h-4 w-4' />
                  Remove
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
