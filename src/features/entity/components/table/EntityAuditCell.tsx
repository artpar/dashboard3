import React, { useCallback } from 'react'
import { TableCell } from '@/components/ui/table'
import { useEntityFormatters } from '../../hooks/useEntityFormatters'
import { ColumnDefinition } from '@/features/entity/columns'
import { CellContextMenu } from './CellContextMenu'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'

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
  const { filters, setFilters } = useEntityCollectionData()

  const handleAddFilter = useCallback((columnName: string, operator: string, value: any) => {
    // Create new filter object
    const newFilters = { ...filters }
    
    // Map our operators to backend format
    let backendOperator = operator
    switch (operator) {
      case '=':
        backendOperator = 'eq'
        break
      case '!=':
        backendOperator = 'neq'
        break
      case 'contains':
        backendOperator = 'like::contains'
        break
      case 'not_contains':
        backendOperator = 'not like::contains'
        break
      case '>':
        backendOperator = 'gt'
        break
      case '<':
        backendOperator = 'lt'
        break
      case '>=':
        backendOperator = 'gte'
        break
      case '<=':
        backendOperator = 'lte'
        break
      case 'is_null':
        backendOperator = 'is null'
        break
      case 'is_not_null':
        backendOperator = 'is not null'
        break
    }
    
    // Handle different operator types
    if (operator === 'is_null' || operator === 'is_not_null') {
      // For null checks, add to advanced filters
      if (!newFilters._advanced) {
        newFilters._advanced = []
      }
      newFilters._advanced.push({
        column: columnName,
        operator: backendOperator,
        value: ''
      })
    } else if (operator === 'contains' || operator === 'not_contains') {
      // For text contains operations
      if (!newFilters._advanced) {
        newFilters._advanced = []
      }
      newFilters._advanced.push({
        column: columnName,
        operator: backendOperator,
        value: value
      })
    } else {
      // For simple equality/comparison operations
      if (operator === '=') {
        // Simple equality - use quick filter
        newFilters[columnName] = value
      } else {
        // Other operations - use advanced filter
        if (!newFilters._advanced) {
          newFilters._advanced = []
        }
        newFilters._advanced.push({
          column: columnName,
          operator: backendOperator,
          value: value
        })
      }
    }
    
    setFilters(newFilters)
  }, [filters, setFilters])

  return (
    <TableCell className='text-xs'>
      <div className='flex flex-col gap-1'>
        {auditColumns.map((column) => (
          <CellContextMenu
            key={column.ColumnName}
            columnName={column.ColumnName}
            value={item[column.ColumnName]}
            onAddFilter={handleAddFilter}
          >
            <div className='flex items-center gap-1'>
              <span className='text-muted-foreground text-xs font-medium'>
                {column.ColumnName === 'reference_id' ? 'ID:' : 'Created:'}
              </span>
              {formatCellValue(item, column)}
            </div>
          </CellContextMenu>
        ))}
      </div>
    </TableCell>
  )
}

export default EntityAuditCell
