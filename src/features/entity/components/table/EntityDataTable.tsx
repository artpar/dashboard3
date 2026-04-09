import React from 'react';
import { ArrowDown, ArrowUp, Copy, Clipboard } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EntityPasteDialog from '@/features/entity/components/dialogs/EntityPasteDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx';
import EntityTableBody from './EntityTableBody';


/**
 * Main data table component that displays entity records
 */
export const EntityDataTable: React.FC = ({handleDelete, handleBulkDelete}) => {
  const {
    data,
    columns,
    isLoading,
    setSelectedItem,
    setShowEditDialog,
    setShowBulkDeleteDialog,
    showBulkDeleteDialog,
    showPasteDialog,
    setShowPasteDialog,
    relations,
    entityName,
    sortColumns,
    setSortColumn,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    isItemSelected,
    copySelectedItems,
    setClipboardData,
  } = useEntityCollectionData()
  // Get column visibility state from context
  const { visibleColumns } = useEntityCollectionData()

  // Listen for custom paste event
  React.useEffect(() => {
    const handlePasteEvent = (event: CustomEvent) => {
      console.log('Paste event:', event)
      const { data } = event.detail;
      if (Array.isArray(data) && data.length > 0) {
        // Set the clipboard data and show the paste dialog
        setClipboardData(data);
        setShowPasteDialog(true);
      }
    };

    // Add event listener for the custom event
    window.addEventListener('entity-paste-trigger', handlePasteEvent as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('entity-paste-trigger', handlePasteEvent as EventListener);
    };
  }, [setClipboardData, setShowPasteDialog]);

  // Filter columns based on visibility settings
  const filteredColumns = React.useMemo(() => {
    return columns.filter((col) => visibleColumns.includes(col.ColumnName))
  }, [columns, visibleColumns])

  // Get audit columns to show
  const auditColumnsToShow = React.useMemo(() => {
    const AUDIT_COLUMNS = ['created_at', 'updated_at', 'reference_id']
    return columns.filter(
      (col) =>
        AUDIT_COLUMNS.includes(col.ColumnName) &&
        ['created_at', 'reference_id'].includes(col.ColumnName)
    )
  }, [columns])

  // Handle row actions
  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setShowEditDialog(true)
  }

  // If columns are not yet loaded or we're loading data, show a loading state
  if (isLoading || columns.length === 0) {
    return (
      <div className='rounded-md border p-2 text-center'>
        <p className='text-muted-foreground'>
          {isLoading ? 'Loading data...' : 'Waiting for columns...'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className='h-full w-full overflow-auto'>
        <Table className='sticky-header-table'>
          <TableHeader className='bg-background'>
            <TableRow>
              <TableHead className='bg-background sticky left-0 top-0 z-20 w-10'>
                <Checkbox
                  checked={
                    selectedItems.length === data.length && data.length > 0
                  }
                  onCheckedChange={selectAllItems}
                  aria-label='Select all rows'
                />
              </TableHead>
              <TableHead className='bg-background sticky left-10 top-0 z-20 min-w-12'></TableHead>
              {filteredColumns.map((column) => {
                const isSorted = column.ColumnName in sortColumns
                const sortDirection = sortColumns[column.ColumnName]

                return (
                  <TableHead
                    className='bg-background sticky top-0 min-w-16'
                    key={column.ColumnName}
                  >
                    <Button
                      variant='ghost'
                      className='hover:bg-muted flex h-8 w-full items-center justify-between px-2 py-0 text-left font-medium'
                      onClick={() => {
                        // Toggle sort direction or set to asc if not sorted
                        if (!isSorted) {
                          setSortColumn(column.ColumnName, 'asc')
                        } else if (sortDirection === 'asc') {
                          setSortColumn(column.ColumnName, 'desc')
                        } else {
                          // Remove this column from sorting
                          const newSortColumns = { ...sortColumns }
                          delete newSortColumns[column.ColumnName]
                          // We can't directly call clearSorting for a single column,
                          // so we update all remaining sort columns
                          Object.entries(newSortColumns).forEach(
                            ([col, dir]) => {
                              setSortColumn(col, dir)
                            }
                          )
                        }
                      }}
                    >
                      <span>{column.ColumnName}</span>
                      {isSorted && (
                        <span className='ml-2'>
                          {sortDirection === 'asc' ? (
                            <ArrowUp className='h-4 w-4' />
                          ) : (
                            <ArrowDown className='h-4 w-4' />
                          )}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                )
              })}
              <TableHead className='text-muted-foreground bg-background sticky top-0 text-xs'>
                Audit Info
              </TableHead>
            </TableRow>
          </TableHeader>

          <EntityTableBody
            data={data}
            className='overflow-y-auto'
            filteredColumns={filteredColumns}
            auditColumns={auditColumnsToShow}
            relations={relations}
            entityName={entityName}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isItemSelected={isItemSelected}
            toggleItemSelection={toggleItemSelection}
          />
        </Table>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
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
            <AlertDialogCancel className={'cursor-pointer'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className='bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/90'
            >
              Delete {selectedItems.length}{' '}
              {selectedItems.length === 1 ? 'item' : 'items'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paste Dialog */}
      <EntityPasteDialog
        open={showPasteDialog}
        onClose={() => setShowPasteDialog(false)}
      />
    </>
  )
}

export default EntityDataTable
