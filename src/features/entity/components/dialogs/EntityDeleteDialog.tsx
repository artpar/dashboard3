import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEntityData } from '@/features/entity/hooks/useEntityData';


/**
 * Dialog for confirming entity deletion
 */
const EntityDeleteDialog: React.FC = () => {
  const {
    entityName,
    selectedItem,
    showDeleteDialog,
    setShowDeleteDialog,
    deleteItem,
  } = useEntityData()

  // Handle the deletion confirmation
  const handleDelete = async () => {
    if (!selectedItem?.reference_id) {
      console.error('Cannot delete: Missing item reference ID')
      setShowDeleteDialog(false)
      return
    }

    try {
      await deleteItem(selectedItem.reference_id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  // Determine the display identifier (name, title, or ID) to show in confirmation
  const getDisplayIdentifier = () => {
    if (!selectedItem) return ''

    // Try to find a descriptive field
    const nameFields = ['name', 'title', 'label', 'email', 'username']

    for (const field of nameFields) {
      if (selectedItem[field]) {
        return selectedItem[field]
      }
    }

    // Fall back to ID if no descriptive field is found
    return selectedItem.reference_id || selectedItem.id || 'this item'
  }

  return (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this {entityName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to delete{' '}
            <span className='font-semibold'>{getDisplayIdentifier()}</span>.
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className='bg-red-600 text-white hover:bg-red-700'
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EntityDeleteDialog
