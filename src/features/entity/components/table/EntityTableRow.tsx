import React, { useCallback, memo } from 'react'
import { EyeIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { TableRow } from '@/components/ui/table'
import { ColumnDefinition } from '@/features/entity/columns'
import EntityAuditCell from './EntityAuditCell'
import EntityTableCell from './EntityTableCell'
import { Link } from '@tanstack/react-router'

// Custom routes for entities with specialized detail pages
const CUSTOM_DETAIL_ROUTES: Record<string, string> = {
  'site': '/storage/sites',
  'cloud_store': '/storage/cloud-stores',
  'integration': '/data/integrations',
  'smd': '/admin/state-machines',
  'mail_server': '/communication/email',
  'action': '/admin/actions',
}

// Generate detail URL for an entity item
function getDetailUrl(entityName: string, item: any): string {
  const itemId = item.reference_id || item.id
  const customRoute = CUSTOM_DETAIL_ROUTES[entityName]
  if (customRoute) {
    return `${customRoute}/${itemId}`
  }
  return `/${entityName}/${itemId}`
}

interface EntityTableRowProps {
  item: any
  index: number
  columns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  relations: any[]
  entityName: string
  onEdit: (item: any) => void
  onDelete: (item: any) => void
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
  entityName,
  onEdit,
  onDelete,
  isSelected,
  onToggleSelect,
}) {
  // Memoize event handlers to prevent recreating them on each render
  const handleToggleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect();
  }, [onToggleSelect]);

  // Get a stable key for the row
  const rowKey = item.id || item.reference_id || index;

  // Generate the detail URL
  const detailUrl = getDetailUrl(entityName, item);

  return (
    <TableRow
      key={rowKey}
      className={`hover:bg-muted/60 ${isSelected ? 'bg-muted/40' : ''}`}
    >
      <td
        onClick={handleToggleSelect}
        className='w-4 cursor-pointer p-2 align-middle hover:bg-gray-200'
      >
        <Checkbox
          checked={isSelected}
          aria-label={`Select row ${index + 1}`}
        />
      </td>
      <td
        title={item.reference_id}
        className='w-12 pl-3 align-middle'
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
    prevProps.entityName === nextProps.entityName
  );
})

export default EntityTableRow
