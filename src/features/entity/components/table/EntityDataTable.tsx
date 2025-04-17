import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FerrisWheel } from 'lucide-react'
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
    relations,
    entityName,
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

  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      <div className='relative flex overflow-y-auto'>
        <Table className='sticky-header-table'>
          <TableHeader className='bg-background'>
            <TableRow>
              <TableHead className='sticky top-0 min-w-12 bg-background'>
                <FerrisWheel />
              </TableHead>
              {filteredColumns.map((column) => (
                <TableHead
                  className='sticky top-0 min-w-16 bg-background'
                  key={column.ColumnName}
                >
                  {column.ColumnName}
                </TableHead>
              ))}
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
          />
        </Table>
      </div>
    </div>
  )
}

export default EntityDataTable
