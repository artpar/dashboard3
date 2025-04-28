import React from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface EntityPasteDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Dialog for confirming paste operation with preview of clipboard data
 */
export const EntityPasteDialog: React.FC<EntityPasteDialogProps> = ({
                                                                      open,
                                                                      onClose,
                                                                    }) => {
  const {
    clipboardData,
    pasteItems,
    entityName,
  } = useEntityCollectionData()

  // If no clipboard data, don't show the dialog
  if (!clipboardData || clipboardData.length === 0) {
    return null
  }

  // Get all unique keys from all clipboard items
  const allKeys = Array.from(
    new Set(
      clipboardData.flatMap(item => Object.keys(item))
    )
  ).filter(key => !key.startsWith('_') && key !== 'id' && key !== 'reference_id')

  // Check if there's a type mismatch
  const hasTypeMismatch = clipboardData.some(item =>
    item.__type && item.__type !== entityName
  )

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Paste {clipboardData.length} item{clipboardData.length !== 1 ? 's' : ''}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasTypeMismatch ?
              "Warning: Some items have a different type than the current entity (" + entityName + "). This may cause issues when pasting."
              :
              "Review the data below before pasting. New items will be created based on this data."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Table container with fixed height and overflow handling */}
        <div className="min-h-[300px] h-full rounded-md border relative overflow-x-auto">
          {/* Table wrapper with both horizontal and vertical scrolling */}
          <div className="overflow-auto h-full w-full">
            {/* The actual table with max width to prevent overflow */}
            <div className="min-w-full table-fixed">
              <Table>
                {/* Fixed header - using sticky positioning */}
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {allKeys.map(key => (
                      <TableHead key={key} className="whitespace-nowrap">{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clipboardData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium w-12">{index + 1}</TableCell>
                      {allKeys.map(key => (
                        <TableCell key={key} className="max-w-xs truncate">
                          {item[key] !== undefined
                            ? typeof item[key] === 'object'
                              ? JSON.stringify(item[key])
                              : String(item[key])
                            : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              pasteItems()
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Paste {clipboardData.length} item{clipboardData.length !== 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EntityPasteDialog
