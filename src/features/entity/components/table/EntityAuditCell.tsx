import React from 'react'
import { TableCell } from '@/components/ui/table'
import { ColumnDefinition } from '../../hooks/useEntityColumns'
import { useEntityFormatters } from '../../hooks/useEntityFormatters'

interface EntityAuditCellProps {
  item: any
  auditColumns: ColumnDefinition[]
}

/**
 * Component for rendering the compact audit information cell
 */
export const EntityAuditCell: React.FC<EntityAuditCellProps> = ({
  item,
  auditColumns,
}) => {
  const { formatCellValue } = useEntityFormatters()

  return (
    <TableCell className='text-xs'>
      <div className='flex flex-col gap-1'>
        {auditColumns.map((column) => (
          <div key={column.key} className='flex items-center gap-1'>
            <span className='text-muted-foreground text-xs font-medium'>
              {column.key === 'reference_id' ? 'ID:' : 'Created:'}
            </span>
            {formatCellValue(item, column)}
          </div>
        ))}
      </div>
    </TableCell>
  )
}

export default EntityAuditCell
