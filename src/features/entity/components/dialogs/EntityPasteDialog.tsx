import React, { useEffect, useState, useCallback } from 'react'
import { TrashIcon } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ColumnEditor } from '@/features/entity/columns/ColumnComponentManager'
import { ColumnDefinition, ColumnType } from '@/features/entity/columns/types'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'
import { SYSTEM_COLUMNS } from '@/features/entity/types.ts'

interface EntityPasteDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Dialog for confirming paste operation with preview of clipboard data
 * Allows editing of the data before pasting
 */
export const EntityPasteDialog: React.FC<EntityPasteDialogProps> = ({
  open,
  onClose,
}) => {
  const {
    clipboardData,
    pasteItems: originalPasteItems,
    entityName,
    columns,
  } = useEntityCollectionData()

  // State to hold the editable clipboard data
  const [editableData, setEditableData] = useState<any[]>([])

  // Update editable data when clipboard data changes
  useEffect(() => {
    if (clipboardData) {
      setEditableData(JSON.parse(JSON.stringify(clipboardData)))
    }
  }, [clipboardData])

  // If no clipboard data, don't show the dialog
  if (!clipboardData || clipboardData.length === 0) {
    return null
  }

  // Get all unique keys from all clipboard items
  const allKeys = Array.from(
    new Set(clipboardData?.flatMap((item) => Object.keys(item)) || [])
  ).filter(
    (key) => !key.startsWith('_') && key !== 'id' && key !== 'reference_id'
  )

  // Find the corresponding column definition for each key
  const columnDefinitions = allKeys.map((key) => {
    const matchingColumn = columns?.find((col) => col.ColumnName === key)
    return (
      matchingColumn ||
      ({
        ColumnName: key,
        Name: key,
        ColumnType: ColumnType.Text,
      } as ColumnDefinition)
    )
  })

  // Check if there's a type mismatch
  const hasTypeMismatch = clipboardData?.some(
    (item) => item.__type && item.__type !== entityName
  )

  // Handle value change for a specific cell
  const handleCellChange = (
    rowIndex: number,
    columnKey: string,
    newValue: any
  ) => {
    console.log(
      'Handle cell change for ',
      columnKey,
      ' to ',
      newValue,
      ' at row ',
      rowIndex
    )
    setEditableData((prevData) => {
      const newData = [...prevData]
      newData[rowIndex] = {
        ...newData[rowIndex],
        [columnKey]: newValue,
      }
      console.log('New data:', newData)
      return newData
    })
  }

  // Custom paste function that uses the edited data
  const pasteItems = useCallback(async () => {
    await originalPasteItems(editableData)
  }, [editableData]);

  return (
    <AlertDialog className='max-h-full' open={open} onOpenChange={onClose}>
      <AlertDialogContent className='max-h-[90vh] w-full max-w-[90vw]'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Paste {clipboardData.length} item
            {clipboardData.length !== 1 ? 's' : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasTypeMismatch
              ? 'Warning: Some items have a different type than the current entity (' +
                entityName +
                '). This may cause issues when pasting.'
              : 'Review the data below before pasting. New items will be created based on this data.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Table container with fixed height and scrollable content */}
        <div className='relative h-[60vh] w-full overflow-hidden rounded-md border'>
          {/* Scrollable container that allows both horizontal and vertical scrolling */}
          <div className='absolute inset-0 overflow-auto'>
            {/* Table wrapper with minimum width to ensure it can grow */}
            <div className='w-max min-w-full'>
              <Table>
                <TableHeader className='bg-background sticky top-0 z-10'>
                  <TableRow>
                    <TableHead className='w-12 whitespace-nowrap'>#</TableHead>
                    {columnDefinitions
                      .filter(
                        (column) => !SYSTEM_COLUMNS.includes(column.ColumnName)
                      )
                      .map((column) => (
                        <TableHead
                          key={column.ColumnName}
                          className='whitespace-nowrap'
                        >
                          {column.Name || column.ColumnName}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editableData.map((item, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell className='w-12 font-medium'>
                        <TrashIcon
                          onClick={() => {
                            console.log('Delete item', item)
                            setEditableData((prevData) => {
                              const newData = [...prevData]
                              newData.splice(rowIndex, 1)
                              return newData
                            })
                          }}
                        ></TrashIcon>
                      </TableCell>
                      {columnDefinitions
                        .filter(
                          (column) =>
                            !SYSTEM_COLUMNS.includes(column.ColumnName)
                        )
                        .map((column) => {
                          const key = column.ColumnName
                          return (
                            <TableCell key={key} className='w-60 p-0'>
                              <div className='p-2'>
                                <ColumnEditor
                                  column={column}
                                  value={item[key]}
                                  entity={item}
                                  onChange={(newValue) =>
                                    handleCellChange(rowIndex, key, newValue)
                                  }
                                  className='w-full'
                                />
                              </div>
                            </TableCell>
                          )
                        })}
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
            className='bg-primary text-primary-foreground hover:bg-primary/90'
          >
            Paste {editableData.length} item
            {editableData.length !== 1 ? 's' : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default EntityPasteDialog
