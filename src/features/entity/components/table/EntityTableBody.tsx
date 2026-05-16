import React, { memo, useMemo } from 'react'
import { TableBody } from '@/components/ui/table'
import EntityTableRow from './EntityTableRow'
import { EntityEmptyState } from './EntityEmptyState'
import { ColumnDefinition } from '@/features/entity/columns'
import { EntityRecord, getEntityId } from '@/features/entity/utils/entityIdentity'

type EntityTableItem = EntityRecord & Record<string, unknown>

interface EntityTableBodyProps {
  data: EntityTableItem[]
  filteredColumns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  entityName: string
  className: string
  onDelete: (item: EntityTableItem) => void
  isItemSelected: (item: EntityTableItem) => boolean
  toggleItemSelection: (item: EntityTableItem) => void
}

/**
 * Component for rendering the table body with rows of data
 */
export const EntityTableBody: React.FC<EntityTableBodyProps> = memo(function EntityTableBody({
  data,
  filteredColumns,
  auditColumns,
  entityName,
  className,
  onDelete,
  isItemSelected,
  toggleItemSelection,
}) {
  // Memoize the row generation to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    return data.map((item, index) => {
      const itemId = getEntityId(item) || index;
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
          entityName={entityName}
          onDelete={onDelete}
          isSelected={isSelected}
          onToggleSelect={handleToggle}
        />
      );
    });
  }, [data, filteredColumns, auditColumns, entityName, onDelete, isItemSelected, toggleItemSelection]);

  // If no data, show contextual empty state
  if (data.length === 0) {
    return (
      <EntityEmptyState
        entityName={entityName}
        colSpan={filteredColumns.length + 4}
        className={className}
      />
    )
  }

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
    prevProps.entityName === nextProps.entityName &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.isItemSelected === nextProps.isItemSelected &&
    prevProps.toggleItemSelection === nextProps.toggleItemSelection
  );
})

export default EntityTableBody
