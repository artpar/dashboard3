import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useEntityData } from './EntityContext';

export const EntityDeleteDialog: React.FC = () => {
  const {
    entityName,
    selectedItem,
    deleteItem,
    showDeleteDialog,
    setShowDeleteDialog
  } = useEntityData();

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      await deleteItem(selectedItem.id || selectedItem.reference_id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Find a good display field for the item
  const getItemDisplayName = () => {
    if (!selectedItem) return '';

    // Try to find a name, title, or label field
    const nameFields = ['name', 'title', 'label', 'display_name', 'email', 'username'];
    for (const field of nameFields) {
      if (selectedItem[field]) {
        return selectedItem[field];
      }
    }

    // Fallback to ID
    return selectedItem.id || selectedItem.reference_id || 'this item';
  };

  return (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{getItemDisplayName()}</strong> from the {entityName} records.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EntityDeleteDialog;
