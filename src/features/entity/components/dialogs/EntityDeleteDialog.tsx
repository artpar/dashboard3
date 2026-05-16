import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx';
import { getEntityId } from '@/features/entity/utils/entityIdentity'


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
  } = useEntityCollectionData()

  // Handle the deletion confirmation
  const handleDelete = async () => {
    const itemId = selectedItem ? getEntityId(selectedItem) : ''
    if (!itemId) {
      setShowDeleteDialog(false)
      return
    }

    try {
      await deleteItem(itemId)
      setShowDeleteDialog(false)
    } catch {
      setShowDeleteDialog(false)
    }
  }

  // Determine the display identifier (name, title, or ID) to show in confirmation
  const getDisplayIdentifier = () => {
    if (!selectedItem) return ''

    // Try to find a descriptive field
    const nameFields = ['name', 'title', 'label', 'email', 'username']

    for (const field of nameFields) {
      if (selectedItem[field]) {
        return String(selectedItem[field])
      }
    }

    // Fall back to ID if no descriptive field is found
    return getEntityId(selectedItem) || 'this item'
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
