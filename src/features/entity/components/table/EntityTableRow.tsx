import React from 'react'
import { EyeIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { TableRow } from '@/components/ui/table'
import { ColumnDefinition } from '@/features/entity/columns'
import EntityAuditCell from './EntityAuditCell'
import EntityTableCell from './EntityTableCell'

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
export const EntityTableRow: React.FC<EntityTableRowProps> = ({
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
}) => {
  return (
    <TableRow
      key={item.id || item.reference_id || index}
      className={isSelected ? 'bg-muted/40' : undefined}
    >
      <td
        onClick={onToggleSelect}
        className='w-4 cursor-pointer p-2 pt-4 hover:bg-gray-200'
      >
        <Checkbox  checked={isSelected} aria-label={`Select row ${index + 1}`} />
      </td>
      <td
        onClick={() => {
          onViewDetails(item)
        }}
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
}

export default EntityTableRow
