import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ArrowDown, ArrowUp, Check, Trash2 } from 'lucide-react'
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
import EntityTableBody from './EntityTableBody'

/**
 * Main data table component that displays entity records
 */
export const EntityDataTable: React.FC = () => {
  const {
    data,
    columns,
    isLoading,
    setSelectedItem,
    setShowEditDialog,
    setShowDeleteDialog,
    setShowBulkDeleteDialog,
    showBulkDeleteDialog,
    relations,
    entityName,
    sortColumns,
    setSortColumn,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    isItemSelected,
    bulkDeleteItems,
    clearSelectedItems
  } = useEntityCollectionData()
  const navigate = useNavigate()
  // Get column visibility state from context
  const {
    visibleColumns
  } = useEntityCollectionData()

  // Filter columns based on visibility settings
  const filteredColumns = React.useMemo(() => {
    return columns.filter(col => visibleColumns.includes(col.ColumnName))
  }, [columns, visibleColumns])

  // Get audit columns to show
  const auditColumnsToShow = React.useMemo(() => {
    const AUDIT_COLUMNS = ['created_at', 'updated_at', 'reference_id']
    return columns.filter(
      col => AUDIT_COLUMNS.includes(col.ColumnName) &&
             ['created_at', 'reference_id'].includes(col.ColumnName)
    )
  }, [columns])

  // Handle row actions
  const handleEdit = (item: any) => {
    setSelectedItem(item)
    setShowEditDialog(true)
  }

  const handleDelete = (item: any) => {
    setSelectedItem(item)
    setShowDeleteDialog(true)
  }

  const handleViewDetails = (item: any) => {
    setSelectedItem(item)
    const itemId = item.id || item.reference_id

    // This would typically open a view dialog
    console.log('View details for:', item)
    navigate({ to: `/${entityName}/${itemId}` })
  }

  // If columns are not yet loaded or we're loading data, show a loading state
  if (isLoading || columns.length === 0) {
    return (
      <div className='rounded-md border p-2 text-center'>
        <p className='text-muted-foreground'>
          {isLoading
            ? 'Loading data...'
            : 'Waiting for columns...'}
        </p>
      </div>
    )
  }

  // Handle bulk delete action
  const handleBulkDelete = async () => {
    if (selectedItems.length > 0) {
      const itemIds = selectedItems.map(item => item.id || item.reference_id);
      await bulkDeleteItems(itemIds);
    }
  };

  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      {/* Bulk Actions Bar - Only visible when items are selected */}
      {selectedItems.length > 0 && (
        <div className='bg-muted/50 border-b flex items-center justify-between px-4 py-2'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              checked={selectedItems.length === data.length && data.length > 0}
              onCheckedChange={selectAllItems}
            />
            <span className='text-sm font-medium'>
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className='flex space-x-2'>
            <Button
              variant='destructive'
              size='sm'
              className='h-8 gap-1'
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className='h-4 w-4' />
              Delete Selected
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='h-8'
              onClick={clearSelectedItems}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className='relative flex overflow-y-auto'>
        <Table className='sticky-header-table'>
          <TableHeader className='bg-background'>
            <TableRow>
              <TableHead className='sticky top-0 bg-background'>
                <Checkbox
                  checked={selectedItems.length === data.length && data.length > 0}
                  onCheckedChange={selectAllItems}
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHead className='sticky top-0 min-w-12 bg-background'>

              </TableHead>
              {filteredColumns.map((column) => {
                const isSorted = column.ColumnName in sortColumns;
                const sortDirection = sortColumns[column.ColumnName];

                return (
                  <TableHead
                    className='sticky top-0 min-w-16 bg-background'
                    key={column.ColumnName}
                  >
                    <Button
                      variant="ghost"
                      className="h-8 px-2 py-0 hover:bg-muted flex items-center justify-between w-full text-left font-medium"
                      onClick={() => {
                        // Toggle sort direction or set to asc if not sorted
                        if (!isSorted) {
                          setSortColumn(column.ColumnName, 'asc');
                        } else if (sortDirection === 'asc') {
                          setSortColumn(column.ColumnName, 'desc');
                        } else {
                          // Remove this column from sorting
                          const newSortColumns = { ...sortColumns };
                          delete newSortColumns[column.ColumnName];
                          // We can't directly call clearSorting for a single column,
                          // so we update all remaining sort columns
                          Object.entries(newSortColumns).forEach(([col, dir]) => {
                            setSortColumn(col, dir);
                          });
                        }
                      }}
                    >
                      <span>{column.ColumnName}</span>
                      {isSorted && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                );
              })}
              <TableHead className='text-muted-foreground sticky top-0 bg-background text-xs'>
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
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            isItemSelected={isItemSelected}
            toggleItemSelection={toggleItemSelection}
          />
        </Table>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedItems.length} selected {entityName} {selectedItems.length === 1 ? 'record' : 'records'} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default EntityDataTable
