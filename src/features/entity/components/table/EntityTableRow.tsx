import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { ColumnDefinition } from '@/features/entity/columns'
import { EyeIcon } from 'lucide-react'
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
      <TableCell className='w-4 p-2 pt-4'>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select row ${index + 1}`}
        />
      </TableCell>
      <TableCell onClick={() => {
        onViewDetails(item)
      }} className='w-12 pl-5 hover:bg-gray-200 hover:cursor-pointer'>
        <EyeIcon  className='w-5 h-5 mt-1' />
      </TableCell>
      {columns.map((column) => (
        <EntityTableCell key={column.ColumnName} item={item} column={column} />
      ))}

      <EntityAuditCell item={item} auditColumns={auditColumns} />
    </TableRow>
  )
}

export default EntityTableRow
