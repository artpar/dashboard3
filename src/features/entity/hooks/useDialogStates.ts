import { useState, useCallback, useMemo } from 'react'

type DialogName = 'create' | 'edit' | 'delete' | 'bulkDelete' | 'filter' | 'paste'

type DialogStates = {
  [K in DialogName]: boolean
}

type DialogSetters = {
  [K in DialogName as `setShow${Capitalize<K>}Dialog`]: (show: boolean) => void
}

type DialogProps = {
  [K in DialogName as `show${Capitalize<K>}Dialog`]: boolean
} & DialogSetters

/**
 * Hook for managing multiple dialog states.
 * Provides individual show/setShow pairs for each dialog.
 */
export function useDialogStates(): DialogProps {
  const [states, setStates] = useState<DialogStates>({
    create: false,
    edit: false,
    delete: false,
    bulkDelete: false,
    filter: false,
    paste: false,
  })

  const setDialog = useCallback((name: DialogName, show: boolean) => {
    setStates(prev => ({ ...prev, [name]: show }))
  }, [])

  return useMemo(() => ({
    showCreateDialog: states.create,
    setShowCreateDialog: (show: boolean) => setDialog('create', show),
    showEditDialog: states.edit,
    setShowEditDialog: (show: boolean) => setDialog('edit', show),
    showDeleteDialog: states.delete,
    setShowDeleteDialog: (show: boolean) => setDialog('delete', show),
    showBulkDeleteDialog: states.bulkDelete,
    setShowBulkDeleteDialog: (show: boolean) => setDialog('bulkDelete', show),
    showFilterDialog: states.filter,
    setShowFilterDialog: (show: boolean) => setDialog('filter', show),
    showPasteDialog: states.paste,
    setShowPasteDialog: (show: boolean) => setDialog('paste', show),
  }), [states, setDialog])
}
