import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import EntityPasteDialog from '@/features/entity/components/dialogs/EntityPasteDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx';
import EntityTableBody from './EntityTableBody';
import { ColumnDefinition } from '@/features/entity/columns';
import { EntityRecord } from '@/features/entity/utils/entityIdentity';

type EntityTableItem = EntityRecord & Record<string, unknown>
type SortDirection = 'asc' | 'desc'

interface EntityDataTableProps {
  handleDelete: (item: EntityTableItem) => void
  handleBulkDelete: () => void | Promise<void>
}

interface EntityDataTableViewProps {
  data: EntityTableItem[]
  filteredColumns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  entityName: string
  sortColumns: Record<string, SortDirection>
  selectedItemsCount: number
  showBulkDeleteDialog: boolean
  showPasteDialog: boolean
  areAllVisibleItemsSelected: boolean
  onToggleAllVisibleItems: () => void
  onToggleSortColumn: (columnName: string) => void
  onBulkDeleteDialogChange: (open: boolean) => void
  onBulkDelete: () => void | Promise<void>
  onPasteDialogClose: () => void
  onDelete: (item: EntityTableItem) => void
  isItemSelected: (item: EntityTableItem) => boolean
  toggleItemSelection: (item: EntityTableItem) => void
}

/**
 * Main data table component that displays entity records
 */
export const EntityDataTable: React.FC<EntityDataTableProps> = ({
  handleDelete,
  handleBulkDelete,
}) => {
  const {
    data: rawData,
    columns,
    isLoading,
    setShowBulkDeleteDialog,
    showBulkDeleteDialog,
    showPasteDialog,
    setShowPasteDialog,
    entityName,
    sortColumns,
    toggleSortColumn,
    selectedItems,
    toggleItemSelection,
    toggleAllVisibleItems,
    areAllVisibleItemsSelected,
    isItemSelected,
    setClipboardData,
    visibleColumns,
  } = useEntityCollectionData()

  const data = rawData as EntityTableItem[]

  // Listen for custom paste event
  React.useEffect(() => {
    const handlePasteEvent = (event: CustomEvent) => {
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
    <EntityDataTableView
      data={data}
      filteredColumns={filteredColumns}
      auditColumns={auditColumnsToShow}
      entityName={entityName}
      sortColumns={sortColumns}
      selectedItemsCount={selectedItems.length}
      showBulkDeleteDialog={showBulkDeleteDialog}
      showPasteDialog={showPasteDialog}
      areAllVisibleItemsSelected={areAllVisibleItemsSelected}
      onToggleAllVisibleItems={toggleAllVisibleItems}
      onToggleSortColumn={toggleSortColumn}
      onBulkDeleteDialogChange={setShowBulkDeleteDialog}
      onBulkDelete={handleBulkDelete}
      onPasteDialogClose={() => setShowPasteDialog(false)}
      onDelete={handleDelete}
      isItemSelected={isItemSelected}
      toggleItemSelection={toggleItemSelection}
    />
  )
}

const EntityDataTableView: React.FC<EntityDataTableViewProps> = ({
  data,
  filteredColumns,
  auditColumns,
  entityName,
  sortColumns,
  selectedItemsCount,
  showBulkDeleteDialog,
  showPasteDialog,
  areAllVisibleItemsSelected,
  onToggleAllVisibleItems,
  onToggleSortColumn,
  onBulkDeleteDialogChange,
  onBulkDelete,
  onPasteDialogClose,
  onDelete,
  isItemSelected,
  toggleItemSelection,
}) => {
  return (
    <>
      <div className='h-full w-full overflow-auto'>
        <Table className='sticky-header-table'>
          <TableHeader className='bg-background'>
            <TableRow>
              <TableHead className='bg-background sticky left-0 top-0 z-[110] w-10'>
                <Checkbox
                  checked={areAllVisibleItemsSelected}
                  onCheckedChange={() => onToggleAllVisibleItems()}
                  aria-label='Select all rows'
                />
              </TableHead>
              <TableHead className='bg-background sticky left-10 top-0 z-[110] min-w-12'></TableHead>
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
                      onClick={() => onToggleSortColumn(column.ColumnName)}
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
              <TableHead className='bg-background sticky top-0 w-10'></TableHead>
            </TableRow>
          </TableHeader>

          <EntityTableBody
            data={data}
            className='overflow-y-auto'
            filteredColumns={filteredColumns}
            auditColumns={auditColumns}
            entityName={entityName}
            onDelete={onDelete}
            isItemSelected={isItemSelected}
            toggleItemSelection={toggleItemSelection}
          />
        </Table>
      </div>

      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={onBulkDeleteDialogChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete {selectedItemsCount}{' '}
              selected {entityName}{' '}
              {selectedItemsCount === 1 ? 'record' : 'records'} and cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={'cursor-pointer'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkDelete}
              className='bg-destructive cursor-pointer text-destructive-foreground hover:bg-destructive/90'
            >
              Delete {selectedItemsCount}{' '}
              {selectedItemsCount === 1 ? 'item' : 'items'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EntityPasteDialog
        open={showPasteDialog}
        onClose={onPasteDialogClose}
      />
    </>
  )
}

export default EntityDataTable
