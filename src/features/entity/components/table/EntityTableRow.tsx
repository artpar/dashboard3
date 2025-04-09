import React from 'react'
import { TableRow } from '@/components/ui/table'
import EntityAuditCell from './EntityAuditCell'
import EntityTableActions from './EntityTableActions'
import EntityTableCell from './EntityTableCell'
import { ColumnDefinition } from '@/features/entity/columns'

interface EntityTableRowProps {
  item: any
  index: number
  columns: ColumnDefinition[]
  auditColumns: ColumnDefinition[]
  relations: any[]
  onEdit: (item: any) => void
  onDelete: (item: any) => void
  onViewDetails: (item: any) => void
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
}) => {
  return (
    <TableRow key={item.id || item.reference_id || index}>
      <EntityTableActions
        item={item}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetails={onViewDetails}
        relations={relations}
      />
      {columns.map((column) => (
        <EntityTableCell key={column.ColumnName} item={item} column={column} />
      ))}

      <EntityAuditCell item={item} auditColumns={auditColumns} />
    </TableRow>
  )
}

export default EntityTableRow
