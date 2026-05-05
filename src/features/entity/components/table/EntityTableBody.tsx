import React, { memo, useMemo } from 'react'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import EntityTableRow from './EntityTableRow'
import { EntityEmptyState } from './EntityEmptyState'
import { ColumnDefinition } from '@/features/entity/columns'

interface EntityTableBodyProps {
  data: any[]
  filteredColumns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  relations: any[]
  entityName: string
  className: string
  onEdit: (item: any) => void
  onDelete: (item: any) => void
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
  entityName,
  className,
  onEdit,
  onDelete,
  isItemSelected,
  toggleItemSelection,
}) {
  // If no data, show contextual empty state
  if (data.length === 0) {
    return (
      <EntityEmptyState
        entityName={entityName}
        colSpan={filteredColumns.length + 3}
        className={className}
      />
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
          entityName={entityName}
          onEdit={onEdit}
          onDelete={onDelete}
          isSelected={isSelected}
          onToggleSelect={handleToggle}
        />
      );
    });
  }, [data, filteredColumns, auditColumns, relations, entityName, onEdit, onDelete, isItemSelected, toggleItemSelection]);

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
