// src/features/entity/relations/UpdateBelongsToDialog.tsx
import { useState } from 'react'
import { PencilIcon, Loader2Icon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EntitySelector } from '../components/EntitySelector'
import { TableRelation, RelationDirection } from './relations-utils'
import { RelationsApiService } from '../services/RelationsApiService'

interface UpdateBelongsToDialogProps {
  entityName: string
  entityId: string
  relation: TableRelation
  direction: RelationDirection
  currentRelatedId?: string
  onSuccess: () => void
  buttonVariant?: 'default' | 'outline' | 'ghost'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  buttonText?: string
}

/**
 * Dialog for updating a belongs_to relation
 */
export function UpdateBelongsToDialog({
  entityName,
  entityId,
  relation,
  direction,
  currentRelatedId,
  onSuccess,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonText = 'Change Relation',
}: UpdateBelongsToDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  // Get the target entity name based on relation direction
  const targetEntityName = direction === RelationDirection.Outbound
    ? relation.Object
    : relation.Subject

  const handleSubmit = async () => {
    if (!selectedEntityId) {
      toast({
        title: 'No Selection',
        description: 'Please select an entity to update the relation.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Determine source and target based on relation direction
      let sourceEntityName, sourceEntityId, targetEntityName, targetEntityId

      if (direction === RelationDirection.Outbound) {
        // This entity points to the related entity
        sourceEntityName = entityName
        sourceEntityId = entityId
        targetEntityName = relation.Object
        targetEntityId = selectedEntityId
      } else {
        // The related entity points to this entity
        sourceEntityName = relation.Subject
        sourceEntityId = selectedEntityId
        targetEntityName = entityName
        targetEntityId = entityId
      }

      // Update the belongs_to relation
      await RelationsApiService.updateBelongsToRelation(
        sourceEntityName,
        sourceEntityId,
        targetEntityName,
        targetEntityId,
        relation
      )

      toast({
        title: 'Relation Updated',
        description: `Successfully updated relation with ${targetEntityName}`,
      })

      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error('Error updating relation:', error)
      toast({
        title: 'Failed to Update Relation',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <PencilIcon className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update {relation.Relation} Relation</DialogTitle>
          <DialogDescription>
            Select a new {targetEntityName} to update this relation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <EntitySelector
            entityName={targetEntityName}
            onSelect={setSelectedEntityId}
            initialSelectedId={currentRelatedId}
            placeholder={`Select ${targetEntityName}...`}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedEntityId || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Relation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
