import React, { useCallback, memo } from 'react'
import { EyeIcon, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ColumnDefinition } from '@/features/entity/columns'
import EntityAuditCell from './EntityAuditCell'
import EntityTableCell from './EntityTableCell'
import { Link } from '@tanstack/react-router'
import { EntityRecord, getEntityDetailPath, getEntityId } from '@/features/entity/utils/entityIdentity'

type EntityTableItem = EntityRecord & Record<string, unknown>

interface EntityTableRowProps {
  item: EntityTableItem
  index: number
  columns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  entityName: string
  onDelete: (item: EntityTableItem) => void
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
  entityName,
  onDelete,
  isSelected,
  onToggleSelect,
}) {
  // Memoize event handlers to prevent recreating them on each render
  const handleToggleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect();
  }, [onToggleSelect]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(item)
  }, [item, onDelete])

  // Get a stable key for the row
  const rowKey = getEntityId(item) || index;

  // Generate the detail URL
  const detailUrl = getEntityDetailPath(entityName, item);

  return (
    <TableRow
      key={rowKey}
      className={`hover:bg-muted/60 ${isSelected ? 'bg-muted/40' : ''}`}
    >
      <td
        onClick={handleToggleSelect}
        className='sticky left-0 z-10 w-10 cursor-pointer bg-background p-2 align-middle hover:bg-gray-200'
      >
        <Checkbox
          checked={isSelected}
          aria-label={`Select row ${index + 1}`}
        />
      </td>
      <td
        title={getEntityId(item)}
        className='sticky left-10 z-10 w-12 bg-background pl-3 align-middle'
      >
        <Link
          to={detailUrl}
          className='flex items-center justify-center hover:text-primary'
          onClick={(e) => e.stopPropagation()}
        >
          <EyeIcon className='h-5 w-5' />
        </Link>
      </td>
      {columns.map((column) => (
        <EntityTableCell key={column.ColumnName} item={item} column={column} />
      ))}

      <EntityAuditCell item={item} auditColumns={auditColumns} />
      <td className='w-10 p-2 align-middle'>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-destructive hover:text-destructive'
          onClick={handleDelete}
          aria-label={`Delete row ${index + 1}`}
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </td>
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
    prevProps.auditColumns === nextProps.auditColumns &&
    prevProps.entityName === nextProps.entityName &&
    prevProps.onToggleSelect === nextProps.onToggleSelect &&
    prevProps.onDelete === nextProps.onDelete
  );
})

export default EntityTableRow
