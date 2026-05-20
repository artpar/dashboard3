import React from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ColumnDefinition } from '@/features/entity/columns'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
import { EntityRecord } from '@/features/entity/utils/entityIdentity'
import EntityTableBody from './EntityTableBody'

type EntityTableItem = EntityRecord & Record<string, unknown>
type SortDirection = 'asc' | 'desc'

interface EntityDataTableProps {
  handleDelete: (item: EntityTableItem) => void
}

interface EntityDataTableViewProps {
  data: EntityTableItem[]
  filteredColumns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  entityName: string
  sortColumns: Record<string, SortDirection>
  areAllVisibleItemsSelected: boolean
  onToggleAllVisibleItems: () => void
  onToggleSortColumn: (columnName: string) => void
  onDelete: (item: EntityTableItem) => void
  isItemSelected: (item: EntityTableItem) => boolean
  toggleItemSelection: (item: EntityTableItem) => void
}

/**
 * Main data table component that displays entity records
 */
export const EntityDataTable: React.FC<EntityDataTableProps> = ({
  handleDelete,
}) => {
  const {
    data: rawData,
    columns,
    isLoading,
    entityName,
    sortColumns,
    toggleSortColumn,
    toggleItemSelection,
    toggleAllVisibleItems,
    areAllVisibleItemsSelected,
    isItemSelected,
    visibleColumns,
  } = useEntityCollectionData()

  const data = rawData as EntityTableItem[]

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
      areAllVisibleItemsSelected={areAllVisibleItemsSelected}
      onToggleAllVisibleItems={toggleAllVisibleItems}
      onToggleSortColumn={toggleSortColumn}
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
  areAllVisibleItemsSelected,
  onToggleAllVisibleItems,
  onToggleSortColumn,
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
              <TableHead className='bg-background sticky top-0 left-0 z-[110] w-10'>
                <Checkbox
                  checked={areAllVisibleItemsSelected}
                  onCheckedChange={() => onToggleAllVisibleItems()}
                  aria-label='Select all rows'
                />
              </TableHead>
              <TableHead className='bg-background sticky top-0 left-10 z-[110] min-w-12'></TableHead>
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
    </>
  )
}

export default EntityDataTable
