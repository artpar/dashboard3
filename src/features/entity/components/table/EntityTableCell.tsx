import React from 'react';
import { TableCell } from '@/components/ui/table';
import NumberColumnViewer from '@/features/entity/columns/viewers/NumberColumnViewer.tsx';
import { ColumnViewer } from '../../columns/ColumnComponentManager';
import { ColumnDefinition } from '../../hooks/useEntityColumns'
import { useEntityFormatters } from '../../hooks/useEntityFormatters'


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
  const { formatCellValue } = useEntityFormatters()

  return (
    <TableCell>
      <ColumnViewer
        column={column}
        value={item[column.ColumnName]}
      />
    </TableCell>
  )
}

export default EntityTableCell
