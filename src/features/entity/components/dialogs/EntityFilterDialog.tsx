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
import { ColumnDefinition } from '@/features/entity/hooks/useEntityColumns'
import { useEntityData } from '@/features/entity/hooks/useEntityData'
import { AUDIT_COLUMNS } from '@/features/entity/utils/entityFormatters'

interface EntityFilterDialogProps {
  open: boolean
  onClose: () => void
  filters: Record<string, any>
  onApplyFilters: (filters: Record<string, any>) => void
}

/**
 * Dialog for configuring entity filters
 */
const EntityFilterDialog: React.FC<EntityFilterDialogProps> = ({
  open,
  onClose,
  filters,
  onApplyFilters,
}) => {
  // Get columns from context
  const { columns } = useEntityData()

  // Local state for filter values
  const [filterValues, setFilterValues] = useState<Record<string, any>>(
    filters || {}
  )

  // Reset local state when filters prop changes
  useEffect(() => {
    setFilterValues(filters || {})
  }, [filters])

  // Filter out audit columns and get filterable columns
  const filterableColumns = columns.filter(
    (column) => !AUDIT_COLUMNS.includes(column.ColumnName)
  )

  // Handle filter value changes
  const handleFilterChange = (columnName: string, value: any) => {
    setFilterValues((prev) => ({
      ...prev,
      [columnName]: value,
    }))
  }

  // Apply filters and close dialog
  const handleApply = () => {
    onApplyFilters(filterValues)
    onClose()
  }

  // Clear all filters
  const handleClearAll = () => {
    setFilterValues({})
  }

  // Render the appropriate filter input based on column type
  const renderFilterInput = (column: ColumnDefinition) => {
    const value = filterValues[column.ColumnName] || ''

    switch (column.ColumnType) {
      case 'boolean':
      case 'checkbox':
        return (
          <Select
            value={value !== '' ? value.toString() : ''}
            onValueChange={(val) => {
              if (val === '') {
                handleFilterChange(column.ColumnName, '')
              } else {
                handleFilterChange(column.ColumnName, val === 'true')
              }
            }}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Any value' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Any value</SelectItem>
              <SelectItem value='true'>Yes</SelectItem>
              <SelectItem value='false'>No</SelectItem>
            </SelectContent>
          </Select>
        )

      case 'enum':
        return (
          <Select
            value={value.toString()}
            onValueChange={(val) => handleFilterChange(column.ColumnName, val)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Any value' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=''>Any value</SelectItem>
              {column.Options?.map((option) => (
                <SelectItem key={option.Value} value={option.Value}>
                  {option.Label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'measurement':
      case 'int':
      case 'integer':
      case 'number':
        return (
          <Input
            type='number'
            value={value}
            onChange={(e) =>
              handleFilterChange(column.ColumnName, e.target.value)
            }
            placeholder='Filter by value'
          />
        )

      // Default to text input for other types
      default:
        return (
          <Input
            value={value}
            onChange={(e) =>
              handleFilterChange(column.ColumnName, e.target.value)
            }
            placeholder='Filter by value'
          />
        )
    }
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
