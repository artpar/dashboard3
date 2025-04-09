import React from 'react'
import { TableCell } from '@/components/ui/table'
import { ColumnViewer } from '@/features/entity/columns'
import { ColumnDefinition } from '../../hooks/useEntityColumns'

interface EntityTableCellProps {
  item: any
  column: ColumnDefinition
}

/**
 * Component for rendering a formatted table cell based on column type
 */
export const EntityTableCell: React.FC<EntityTableCellProps> = ({
  item,
  column,
}) => {
  console.log('EntityTableCell', item, column)
  return (
    <TableCell>
      <ColumnViewer
        column={column}
        value={item[column.ColumnName]}
        entity={item}
      />
    </TableCell>
  )
}

export default EntityTableCell
