import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import EntityForm from '@/features/entity/components/EntityForm.tsx'

function EntityEditorDialog({
  showCreateDialog,
  showEditDialog,
  setShowCreateDialog,
  setShowEditDialog,
  entityName,
}) {
  return (
    <Dialog
      open={showCreateDialog || showEditDialog}
      onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setShowEditDialog(false)
        }
      }}
    >
      <DialogContent className='max-h-[80vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {showCreateDialog
              ? `Create New ${entityName}`
              : `Edit ${entityName}`}
          </DialogTitle>
          <DialogDescription>
            {showCreateDialog
              ? `Fill out the form below to create a new ${entityName}.`
              : `Update the ${entityName} information.`}
          </DialogDescription>
        </DialogHeader>

        <EntityForm
          mode={showCreateDialog ? 'create' : 'edit'}
          onClose={() => {
            setShowCreateDialog(false)
            setShowEditDialog(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export default EntityEditorDialog
