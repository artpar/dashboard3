import React from 'react';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEntityData } from '@/features/entity';


/**
 * Component for entity deletion confirmation
 */
export const EntityDeleteDialog: React.FC = () => {
  const {
    entityName,
    selectedItem,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteItem,
  } = useEntityData()

  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!selectedItem) return

    setIsDeleting(true)

    try {
      await deleteItem(selectedItem.id || selectedItem.reference_id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the {entityName}
            {selectedItem?.name && <span> "{selectedItem.name}"</span>}
            {selectedItem?.title && <span> "{selectedItem.title}"</span>}.
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EntityDeleteDialog
