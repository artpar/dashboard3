import React, { useEffect, useState } from 'react'
import { FilterX, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useEntityCollectionData } from '@/features/entity/hooks/useEntityCollectionData.tsx'
import { AUDIT_COLUMNS } from '@/features/entity/utils/entityFormatters'
import { ColumnDefinition } from '@/features/entity/columns'

export interface FilterQuery {
  column: string
  operator: string
  value: any
}

interface EntityFilterDialogProps {
  open: boolean
  onClose: () => void
  filters: FilterQuery[]
  onApplyFilters: (filters: FilterQuery[]) => void
}

/**
 * Dialog for configuring entity filters
 */
// Define available operators for different column types
const getOperatorsForColumnType = (columnType: string) => {
  const textOperators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'like::contains', label: 'Contains' },
    { value: 'ilike::contains', label: 'Contains (case-insensitive)' },
    { value: 'not like::contains', label: 'Does not contain' },
    { value: 'not ilike::contains', label: 'Does not contain (case-insensitive)' },
    { value: 'like::startsWith', label: 'Starts with' },
    { value: 'like::endsWith', label: 'Ends with' },
    { value: 'not like::startsWith', label: 'Does not start with' },
    { value: 'not like::endsWith', label: 'Does not end with' },
    { value: 'is null', label: 'Is empty' },
    { value: 'is not null', label: 'Is not empty' },
  ]

  const numberOperators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater than or equal' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less than or equal' },
    { value: 'is null', label: 'Is empty' },
    { value: 'is not null', label: 'Is not empty' },
  ]

  const booleanOperators = [
    { value: 'is true', label: 'Is true' },
    { value: 'is false', label: 'Is false' },
    { value: 'is null', label: 'Is empty' },
    { value: 'is not null', label: 'Is not empty' },
  ]

  switch (columnType) {
    case 'boolean':
    case 'checkbox':
      return booleanOperators
    case 'measurement':
    case 'int':
    case 'integer':
    case 'number':
    case 'date':
    case 'datetime':
      return numberOperators
    default:
      return textOperators
  }
}

const EntityFilterDialog: React.FC<EntityFilterDialogProps> = ({
                                                                 open,
                                                                 onClose,
                                                                 filters,
                                                                 onApplyFilters,
                                                               }) => {
  // Get columns from context
  const { columns } = useEntityCollectionData()

  // Local state for filter values - ensure it's always an array
  const [filterQueries, setFilterQueries] = useState<FilterQuery[]>(
    Array.isArray(filters) ? filters : []
  )

  // Reset local state when filters prop changes
  useEffect(() => {
    setFilterQueries(Array.isArray(filters) ? filters : [])
  }, [filters])

  // Filter out audit columns and get filterable columns
  const filterableColumns = columns.filter(
    (column) => !AUDIT_COLUMNS.includes(column.ColumnName)
  )

  // Handle filter changes
  const handleFilterChange = (columnName: string, operator: string, value: any) => {
    setFilterQueries((prev) => {
      const existing = prev.find(f => f.column === columnName)

      if (existing) {
        // Update existing filter
        return prev.map(f =>
          f.column === columnName
            ? { column: columnName, operator, value }
            : f
        )
      } else {
        // Add new filter regardless of value
        // This allows the operator to be selected first
        return [...prev, { column: columnName, operator, value }]
      }
    })
  }

  // Remove a filter
  const handleRemoveFilter = (columnName: string) => {
    setFilterQueries((prev) => prev.filter(f => f.column !== columnName))
  }

  // Apply filters and close dialog
  const handleApply = () => {
    // Filter out incomplete filters before applying
    const validFilters = filterQueries.filter(filter => {
      const operatorNeedsValue = !['is null', 'is not null', 'is true', 'is false'].includes(filter.operator)
      // Include filter if operator doesn't need value, or if it has a non-empty value
      return !operatorNeedsValue || (filter.value !== '' && filter.value !== null && filter.value !== undefined)
    })
    
    onApplyFilters(validFilters)
    onClose()
  }

  // Clear all filters
  const handleClearAll = () => {
    setFilterQueries([])
  }

  // Get current filter for a column
  const getFilterForColumn = (columnName: string): FilterQuery | undefined => {
    return Array.isArray(filterQueries) ? filterQueries.find(f => f.column === columnName) : undefined
  }

  // Render the appropriate filter input based on column type
  const renderFilterInput = (column: ColumnDefinition) => {
    const currentFilter = getFilterForColumn(column.ColumnName)
    const operators = getOperatorsForColumnType(column.ColumnType)
    const selectedOperator = currentFilter?.operator || operators[0].value
    const value = currentFilter?.value || ''

    // Check if operator needs value input
    const needsValueInput = !['is null', 'is not null', 'is true', 'is false'].includes(selectedOperator)

    return (
      <div className='space-y-2'>
        {/* Operator selector */}
        <Select
          value={selectedOperator}
          onValueChange={(op) => {
            const operatorNeedsValue = !['is null', 'is not null', 'is true', 'is false'].includes(op)
            if (!operatorNeedsValue) {
              // For operators that don't need a value, apply immediately
              handleFilterChange(column.ColumnName, op, null)
            } else {
              // For operators that need a value, update with current value (even if empty)
              // This allows the user to select an operator first, then enter a value
              handleFilterChange(column.ColumnName, op, value)
            }
          }}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select operator' />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Value input - only shown when needed */}
        {needsValueInput && (
          <>
            {column.ColumnType === 'enum' ? (
              <Select
                value={value !== undefined && value !== '' ? value.toString() : ''}
                onValueChange={(val) => handleFilterChange(column.ColumnName, selectedOperator, val)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select value' />
                </SelectTrigger>
                <SelectContent>
                  {column.Options?.map((option) => (
                    <SelectItem key={option.Value} value={option.Value || `option-${option.Label}`}>
                      {option.Label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : ['measurement', 'int', 'integer', 'number'].includes(column.ColumnType) ? (
              <Input
                type='number'
                value={value}
                onChange={(e) => handleFilterChange(column.ColumnName, selectedOperator, e.target.value)}
                placeholder='Enter value'
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => handleFilterChange(column.ColumnName, selectedOperator, e.target.value)}
                placeholder={selectedOperator.includes('like') ? 'Enter pattern (use % for wildcard)' : 'Enter value'}
              />
            )}
          </>
        )}

        {/* Remove filter button */}
        {currentFilter && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => handleRemoveFilter(column.ColumnName)}
            className='w-full'
          >
            Remove filter
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5' /> Filters
          </DialogTitle>
        </DialogHeader>

        <div className='max-h-[60vh] overflow-y-auto py-4'>
          <div className='space-y-6'>
            {filterableColumns.map((column) => (
              <div key={column.ColumnName} className='space-y-2'>
                <Label htmlFor={column.ColumnName}>
                  {column.Name || column.ColumnName}
                </Label>
                {renderFilterInput(column)}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <DialogFooter className='gap-2 sm:justify-between'>
          <Button
            type='button'
            variant='ghost'
            onClick={handleClearAll}
            className='gap-1'
          >
            <FilterX className='h-4 w-4' />
            Clear All
          </Button>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='button' onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EntityFilterDialog
