import React from 'react'
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
import EntityPasteDialog from '@/features/entity/components/dialogs/EntityPasteDialog'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'

interface EntityCollectionDialogsProps {
  onBulkDelete: () => void | Promise<void>
}

export const EntityCollectionDialogs: React.FC<
  EntityCollectionDialogsProps
> = ({ onBulkDelete }) => {
  const {
    entityName,
    selectedItems,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    showPasteDialog,
    setShowPasteDialog,
    setClipboardData,
  } = useEntityCollectionData()

  React.useEffect(() => {
    const handlePasteEvent = (event: CustomEvent) => {
      const { data } = event.detail
      if (Array.isArray(data) && data.length > 0) {
        setClipboardData(data)
        setShowPasteDialog(true)
      }
    }

    window.addEventListener(
      'entity-paste-trigger',
      handlePasteEvent as EventListener
    )

    return () => {
      window.removeEventListener(
        'entity-paste-trigger',
        handlePasteEvent as EventListener
      )
    }
  }, [setClipboardData, setShowPasteDialog])

  return (
    <>
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedItems.length}{' '}
              selected {entityName}{' '}
              {selectedItems.length === 1 ? 'record' : 'records'} and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='cursor-pointer'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer'
            >
              Delete {selectedItems.length}{' '}
              {selectedItems.length === 1 ? 'item' : 'items'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EntityPasteDialog
        open={showPasteDialog}
        onClose={() => setShowPasteDialog(false)}
      />
    </>
  )
}

export default EntityCollectionDialogs
