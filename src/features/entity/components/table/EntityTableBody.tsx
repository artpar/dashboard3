import React, { memo, useMemo } from 'react'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import EntityTableRow from './EntityTableRow'
import { ColumnDefinition } from '@/features/entity/columns'

interface EntityTableBodyProps {
  data: any[]
  filteredColumns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  relations: any[]
  className: string
  onEdit: (item: any) => void
  onDelete: (item: any) => void
  onViewDetails: (item: any) => void
  isItemSelected: (item: any) => boolean
  toggleItemSelection: (item: any) => void
}

/**
 * Component for rendering the table body with rows of data
 */
export const EntityTableBody: React.FC<EntityTableBodyProps> = memo(function EntityTableBody({
  data,
  filteredColumns,
  auditColumns,
  relations,
  className,
  onEdit,
  onDelete,
  onViewDetails,
  isItemSelected,
  toggleItemSelection,
}) {
  // If no data, show empty state
  if (data.length === 0) {
    return (
      <TableBody className={className}>
        <TableRow>
          <TableCell
            colSpan={filteredColumns.length + 3} // +3 for checkbox, actions, and audit columns
            className='text-muted-foreground py-6 text-center'
          >
            No data found
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  // Memoize the row generation to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    return data.map((item, index) => {
      const itemId = item.id || item.reference_id || index;
      const isSelected = isItemSelected(item);
      
      // Create a memoized toggle handler for this specific item
      const handleToggle = () => toggleItemSelection(item);
      
      return (
        <EntityTableRow
          key={itemId}
          item={item}
          index={index}
          columns={filteredColumns}
          auditColumns={auditColumns}
          relations={relations}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewDetails={onViewDetails}
          isSelected={isSelected}
          onToggleSelect={handleToggle}
        />
      );
    });
  }, [data, filteredColumns, auditColumns, relations, onEdit, onDelete, onViewDetails, isItemSelected, toggleItemSelection]);

  // Render the memoized rows
  return (
    <TableBody className={className}>
      {tableRows}
    </TableBody>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if these specific props change
  return (
    prevProps.data === nextProps.data &&
    prevProps.filteredColumns === nextProps.filteredColumns &&
    prevProps.auditColumns === nextProps.auditColumns &&
    prevProps.isItemSelected === nextProps.isItemSelected &&
    prevProps.toggleItemSelection === nextProps.toggleItemSelection
  );
})

export default EntityTableBody
