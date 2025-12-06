import React, { useCallback } from 'react'
import { TableCell } from '@/components/ui/table'
import { ColumnDefinition, ColumnViewer } from '@/features/entity/columns'
import { CellContextMenu } from './CellContextMenu'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData'

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
    } else if (operator === 'not_between') {
      // For range exclusion - create two filters
      if (!newFilters._advanced) {
        newFilters._advanced = []
      }
      const [min, max] = value
      newFilters._advanced.push({
        column: columnName,
        operator: 'lt',
        value: min
      })
      newFilters._advanced.push({
        column: columnName,
        operator: 'gt',
        value: max
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
