import React, { useCallback, memo } from 'react'
import { EyeIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { TableRow } from '@/components/ui/table'
import { ColumnDefinition } from '@/features/entity/columns'
import EntityAuditCell from './EntityAuditCell'
import EntityTableCell from './EntityTableCell'
import { Link } from '@tanstack/react-router'

interface EntityTableRowProps {
  item: any
  index: number
  columns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  relations: any[]
  onEdit: (item: any) => void
  onDelete: (item: any) => void
  onViewDetails: (item: any) => void
  isSelected: boolean
  onToggleSelect: () => void
}

/**
 * Component for rendering a table row with formatted cells
 */
export const EntityTableRow: React.FC<EntityTableRowProps> = memo(function EntityTableRow({
  item,
  index,
  columns,
  auditColumns,
  relations,
  onEdit,
  onDelete,
  onViewDetails,
  isSelected,
  onToggleSelect,
}) {
  // Memoize event handlers to prevent recreating them on each render
  const handleToggleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect();
  }, [onToggleSelect]);

  const handleViewDetails = useCallback(() => {
    onViewDetails(item);
  }, [onViewDetails, item]);

  // Get a stable key for the row
  const rowKey = item.id || item.reference_id || index;

  return (
    <TableRow
      key={rowKey}
      className={isSelected ? 'bg-muted/40' : undefined}
    >
      <td
        onClick={handleToggleSelect}
        className='w-4 cursor-pointer p-2 pt-4 hover:bg-gray-200'
      >
        <Checkbox
          checked={isSelected}
          aria-label={`Select row ${index + 1}`}
        />
      </td>
      <td
        onClick={handleViewDetails}
        title={item.reference_id}
        className='w-12 pl-3 hover:cursor-pointer hover:bg-gray-200'
      >
        <EyeIcon className='mt-1 h-5 w-5' />
      </td>
      {columns.map((column) => (
        <EntityTableCell key={column.ColumnName} item={item} column={column} />
      ))}

      <EntityAuditCell item={item} auditColumns={auditColumns} />
    </TableRow>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if these specific props change
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.item === nextProps.item &&
    prevProps.index === nextProps.index &&
    prevProps.columns === nextProps.columns &&
    prevProps.auditColumns === nextProps.auditColumns
  );
})

export default EntityTableRow
